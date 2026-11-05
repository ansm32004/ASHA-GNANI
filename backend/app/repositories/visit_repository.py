from typing import List, Optional, Dict, Any
from app.repositories.mock_data import generate_mock_visits
from app.integrations.firebase.firestore_repository import FirestoreRepository
from app.core.logging import logger
from datetime import datetime

class VisitRepository:
    def __init__(self):
        self._firestore = FirestoreRepository("visits")
        self._visits: List[Dict[str, Any]] = generate_mock_visits()
        self._initialized_db = False

    def _ensure_synced(self):
        if not self._firestore.is_connected:
            return
        if not self._initialized_db:
            try:
                self._firestore.seed_if_empty(self._visits, id_key="id")
                remote_docs = self._firestore.list_all()
                if remote_docs:
                    self._visits = remote_docs
                self._initialized_db = True
            except Exception as e:
                logger.warning(f"VisitRepository sync warning: {e}")

    def list_all(
        self,
        household_id: Optional[str] = None,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        self._ensure_synced()
        if self._firestore.is_connected:
            try:
                remote_docs = self._firestore.list_all()
                if remote_docs:
                    self._visits = remote_docs
            except Exception as e:
                logger.warning(f"Could not refresh visits from Firestore: {e}")

        results = self._visits.copy()
        if household_id:
            results = [v for v in results if v.get("household_id") == household_id]
        if category and category != "All":
            results = [v for v in results if v.get("activity_category", "").lower() == category.lower()]
        results.sort(key=lambda x: x.get("visit_date", ""), reverse=True)
        return results

    def get_by_id(self, visit_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_synced()
        if self._firestore.is_connected:
            try:
                doc = self._firestore.get(visit_id)
                if doc:
                    return doc
            except Exception as e:
                logger.warning(f"Error fetching visit {visit_id} from Firestore: {e}")

        for v in self._visits:
            if v["id"] == visit_id:
                return v
        return None

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        self._ensure_synced()
        new_id = f"vis_{len(self._visits) + 1:03d}"
        now_iso = datetime.now().isoformat() + "Z"

        record = {
            "id": new_id,
            "household_id": data["household_id"],
            "household_name": data.get("household_name", "Household"),
            "beneficiary_name": data.get("beneficiary_name"),
            "visit_date": data.get("visit_date", datetime.now().strftime("%Y-%m-%d")),
            "activity_category": data.get("activity_category", "Maternal Health"),
            "activity_description": data["activity_description"],
            "visit_outcome": data.get("visit_outcome", "Normal"),
            "follow_up_required": data.get("follow_up_required", False),
            "follow_up_date": data.get("follow_up_date"),
            "priority": data.get("priority", "Routine"),
            "notes": data.get("notes"),
            "status": "Confirmed",
            "created_task_id": data.get("created_task_id"),
            "created_at": now_iso,
            "synced": True
        }

        if self._firestore.is_connected:
            self._firestore.set(new_id, record)

        self._visits.insert(0, record)
        return record

    def delete(self, visit_id: str) -> bool:
        record = self.get_by_id(visit_id)
        if not record:
            return False
        if self._firestore.is_connected:
            self._firestore.delete(visit_id)
        self._visits = [v for v in self._visits if v.get("id") != visit_id]
        return True

visit_repo = VisitRepository()

