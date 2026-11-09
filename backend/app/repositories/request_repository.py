import uuid
from typing import List, Optional, Dict, Any
from app.config import settings
from app.repositories.mock_data import generate_mock_requests
from app.integrations.firebase.firestore_repository import FirestoreRepository
from app.core.logging import logger
from datetime import datetime

class RequestRepository:
    def __init__(self):
        self._firestore = FirestoreRepository("community_requests")
        self._requests: List[Dict[str, Any]] = generate_mock_requests()
        self._initialized_db = False

    def _ensure_synced(self):
        if not self._firestore.is_connected:
            return
        if not self._initialized_db:
            try:
                self._firestore.seed_if_empty(self._requests, id_key="id")
                remote_docs = self._firestore.list_all()
                if remote_docs:
                    self._requests = remote_docs
                self._initialized_db = True
            except Exception as e:
                logger.warning(f"RequestRepository sync warning: {e}")

    def list_all(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        household_id: Optional[str] = None,
        assigned_asha_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        self._ensure_synced()
        results = self._requests.copy()
        if household_id:
            results = [r for r in results if r.get("household_id") == household_id]
        if assigned_asha_id:
            results = [r for r in results if r.get("assigned_asha_id") is None or r.get("assigned_asha_id") == assigned_asha_id]
        if status and status != "All":
            results = [r for r in results if r.get("status", "").lower() == status.lower()]
        if category and category != "All":
            results = [r for r in results if r.get("category", "").lower() == category.lower()]
        if priority and priority != "All":
            results = [r for r in results if r.get("priority", "").lower() == priority.lower()]

        priority_map = {"Urgent": 0, "High": 1, "Medium": 2, "Low": 3}
        status_map = {"New": 0, "Acknowledged": 1, "In progress": 2, "Escalated": 3, "Resolved": 4}
        results.sort(key=lambda x: (status_map.get(x.get("status"), 5), priority_map.get(x.get("priority"), 5)))
        return results

    def get_by_id(self, req_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_synced()
        if self._firestore.is_connected:
            try:
                doc = self._firestore.get(req_id)
                if doc:
                    return doc
            except Exception as e:
                logger.warning(f"Error fetching request {req_id} from Firestore: {e}")

        for r in self._requests:
            if r["id"] == req_id:
                return r
        return None

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        self._ensure_synced()
        new_id = data.get("id") or f"req_{uuid.uuid4().hex[:10]}"
        now_iso = datetime.now().isoformat() + "Z"

        record = {
            "id": new_id,
            "household_id": data["household_id"],
            "household_name": data.get("household_name", "Household"),
            "beneficiary_name": data.get("beneficiary_name"),
            "contact_number": data.get("contact_number", "9871100000"),
            "village": data.get("village", "Rampur Kalan"),
            "assigned_asha_id": data.get("assigned_asha_id", "asha_sunita_001"),
            "category": data["category"],
            "description": data["description"],
            "time_received": "Just now",
            "priority": data.get("priority", "Medium"),
            "preferred_date": data.get("preferred_date"),
            "status": "New",
            "response_history": [f"Request logged at {datetime.now().strftime('%H:%M')}"],
            "created_at": now_iso,
            "updated_at": now_iso
        }

        if self._firestore.is_connected:
            self._firestore.set(new_id, record)
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot submit request.")

        self._requests.insert(0, record)
        return record

    def update_action(self, req_id: str, action: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        record = self.get_by_id(req_id)
        if not record:
            return None
        
        now_str = datetime.now().strftime("%d %b %H:%M")
        act_lower = action.lower()
        if "ack" in act_lower:
            record["status"] = "Acknowledged"
            msg = f"Acknowledged by ASHA at {now_str}" + (f": {notes}" if notes else "")
            record.setdefault("response_history", []).append(msg)
        elif "schedul" in act_lower:
            record["status"] = "Scheduled"
            msg = f"Visit scheduled by ASHA at {now_str}" + (f": {notes}" if notes else "")
            record.setdefault("response_history", []).append(msg)
            # Automatically create task for ASHA and reminder notification for household
            try:
                from app.repositories.task_repository import task_repo
                from app.repositories.notification_repository import notification_repo
                from datetime import timedelta
                due_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
                task_repo.create({
                    "household_id": record["household_id"],
                    "household_name": record.get("household_name", "Household"),
                    "beneficiary_name": record.get("beneficiary_name") or record.get("household_name"),
                    "village": record.get("village", "Rampur Kalan"),
                    "assigned_asha_id": record.get("assigned_asha_id", "asha_sunita_001"),
                    "task_type": "Household visit",
                    "description": f"Scheduled Visit: {record.get('description', '')}" + (f" ({notes})" if notes else ""),
                    "due_date": due_date,
                    "priority": record.get("priority", "Medium"),
                    "created_from": "Request"
                })
                notification_repo.create({
                    "title": "Visit Scheduled by ASHA",
                    "message": f"ASHA Sunita Devi scheduled your visit for {due_date}. Notes: {notes or 'Routine check'}",
                    "category": "Household visit",
                    "priority": record.get("priority", "Medium"),
                    "userId": f"comm_{record['household_id']}"
                })
            except Exception as err:
                logger.warning(f"Could not auto-create task from request action: {err}")
        elif "resolve" in act_lower:
            record["status"] = "Resolved"
            msg = f"Resolved at {now_str}" + (f": {notes}" if notes else "")
            record.setdefault("response_history", []).append(msg)
        elif "escalat" in act_lower:
            record["status"] = "Escalated"
            msg = f"Escalated to ANM/MO at {now_str}" + (f": {notes}" if notes else "")
            record.setdefault("response_history", []).append(msg)
        elif "in_prog" in act_lower or "progress" in act_lower:
            record["status"] = "In progress"
            msg = f"Action started at {now_str}" + (f": {notes}" if notes else "")
            record.setdefault("response_history", []).append(msg)

        record["updated_at"] = datetime.now().isoformat() + "Z"

        if self._firestore.is_connected:
            self._firestore.set(req_id, record, merge=True)
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot update request.")

        return record

    def delete(self, req_id: str) -> bool:
        record = self.get_by_id(req_id)
        if not record:
            return False
        if self._firestore.is_connected:
            self._firestore.delete(req_id)
        self._requests = [r for r in self._requests if r.get("id") != req_id]
        return True

request_repo = RequestRepository()

