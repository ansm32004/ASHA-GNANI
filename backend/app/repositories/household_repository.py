import uuid
from typing import List, Optional, Dict, Any
from app.config import settings
from app.repositories.mock_data import generate_mock_households, DEMO_USER
from app.integrations.firebase.firestore_repository import FirestoreRepository
from app.core.logging import logger
from datetime import datetime

class HouseholdRepository:
    def __init__(self):
        self._firestore = FirestoreRepository("households")
        self._households: List[Dict[str, Any]] = generate_mock_households()
        self._initialized_db = False

    def _ensure_synced(self):
        if not self._firestore.is_connected:
            return
        if not self._initialized_db:
            try:
                self._firestore.seed_if_empty(self._households, id_key="id")
                remote_docs = self._firestore.list_all()
                if remote_docs:
                    self._households = remote_docs
                self._initialized_db = True
            except Exception as e:
                logger.warning(f"HouseholdRepository sync warning: {e}")

    def list_all(
        self,
        search: Optional[str] = None,
        village: Optional[str] = None,
        priority: Optional[str] = None,
        has_pending: Optional[bool] = None,
        assigned_asha_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        self._ensure_synced()
        results = self._households.copy()

        if assigned_asha_id:
            results = [h for h in results if h.get("assigned_asha_id") == assigned_asha_id]

        if search:
            q = search.lower().strip()
            results = [
                h for h in results
                if q in h.get("primary_contact_name", "").lower()
                or q in h.get("household_id", "").lower()
                or any(q in m.get("name", "").lower() for m in h.get("members", []))
            ]

        if village and village != "All":
            results = [h for h in results if h.get("village", "").lower() == village.lower()]

        if priority and priority != "All":
            results = [h for h in results if h.get("priority", "").lower() == priority.lower()]

        if has_pending is not None:
            if has_pending:
                results = [h for h in results if h.get("pending_tasks_count", 0) > 0]
            else:
                results = [h for h in results if h.get("pending_tasks_count", 0) == 0]

        return results

    def get_by_id(self, household_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_synced()
        if self._firestore.is_connected:
            try:
                doc = self._firestore.get(household_id)
                if doc:
                    return doc
            except Exception as e:
                logger.warning(f"Error fetching household {household_id} from Firestore: {e}")

        for h in self._households:
            if h["id"] == household_id or h.get("household_id") == household_id:
                return h
        return None

    def create(self, data: Dict[str, Any], asha_id: Optional[str] = None) -> Dict[str, Any]:
        self._ensure_synced()
        new_id = data.get("id") or f"hh_{uuid.uuid4().hex[:10]}"
        v = data.get("village", "Rampur Kalan")
        hh_code = data.get("household_id") or f"HH-{v[:2].upper()}-{uuid.uuid4().hex[:6].upper()}"
        now_iso = datetime.now().isoformat() + "Z"

        record = {
            "id": new_id,
            "household_id": hh_code,
            "primary_contact_name": data["primary_contact_name"],
            "village": v,
            "sub_area": data.get("sub_area", ""),
            "contact_number": data["contact_number"],
            "preferred_language": data.get("preferred_language", "hi"),
            "address": data.get("address", ""),
            "consent_status": data.get("consent_status", True),
            "priority": "Routine",
            "assigned_asha_id": asha_id or data.get("assigned_asha_id") or DEMO_USER["id"],
            "last_visit_date": None,
            "next_follow_up": None,
            "pending_tasks_count": 0,
            "created_at": now_iso,
            "updated_at": now_iso,
            "members": data.get("members", [])
        }

        if self._firestore.is_connected:
            self._firestore.set(new_id, record)
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot create household.")

        self._households.insert(0, record)
        return record

    def update(self, household_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        record = self.get_by_id(household_id)
        if not record:
            return None
        
        for k, v in data.items():
            if v is not None:
                record[k] = v
        record["updated_at"] = datetime.now().isoformat() + "Z"

        if self._firestore.is_connected:
            target_id = record.get("id", household_id)
            self._firestore.set(target_id, record, merge=True)
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot update household.")

        return record

    def delete(self, household_id: str) -> bool:
        record = self.get_by_id(household_id)
        if not record:
            return False
        target_id = record.get("id", household_id)
        if self._firestore.is_connected:
            self._firestore.delete(target_id)
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot delete household.")

        self._households = [h for h in self._households if h.get("id") != target_id and h.get("household_id") != household_id]
        return True

    def update_visit_and_followup(self, household_id: str, visit_date: str, next_followup: Optional[str]):
        record = self.get_by_id(household_id)
        if record:
            record["last_visit_date"] = visit_date
            if next_followup:
                record["next_follow_up"] = next_followup
                record["pending_tasks_count"] = record.get("pending_tasks_count", 0) + 1
            record["updated_at"] = datetime.now().isoformat() + "Z"
            if self._firestore.is_connected:
                target_id = record.get("id", household_id)
                self._firestore.set(target_id, record, merge=True)
            elif not getattr(settings, "DEMO_MODE", False):
                raise RuntimeError("Cloud Firestore is disconnected in live mode.")

household_repo = HouseholdRepository()

