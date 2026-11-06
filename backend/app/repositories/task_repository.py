import uuid
from typing import List, Optional, Dict, Any
from app.config import settings
from app.repositories.mock_data import generate_mock_tasks
from app.integrations.firebase.firestore_repository import FirestoreRepository
from app.core.logging import logger
from datetime import datetime, date

class TaskRepository:
    def __init__(self):
        self._firestore = FirestoreRepository("tasks")
        self._tasks: List[Dict[str, Any]] = generate_mock_tasks()
        self._initialized_db = False

    def _ensure_synced(self):
        if not self._firestore.is_connected:
            return
        if not self._initialized_db:
            try:
                self._firestore.seed_if_empty(self._tasks, id_key="id")
                remote_docs = self._firestore.list_all()
                if remote_docs:
                    self._tasks = remote_docs
                self._initialized_db = True
            except Exception as e:
                logger.warning(f"TaskRepository sync warning: {e}")

    def list_all(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        date_filter: Optional[str] = None,
        household_id: Optional[str] = None,
        assigned_asha_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        self._ensure_synced()
        if self._firestore.is_connected:
            try:
                remote_docs = self._firestore.list_all()
                if remote_docs:
                    self._tasks = remote_docs
            except Exception as e:
                logger.warning(f"Could not refresh tasks from Firestore: {e}")

        results = self._tasks.copy()

        if assigned_asha_id:
            results = [t for t in results if not t.get("assigned_asha_id") or t.get("assigned_asha_id") == assigned_asha_id]

        if status and status != "All":
            results = [t for t in results if t.get("status", "").lower() == status.lower()]

        if priority and priority != "All":
            results = [t for t in results if t.get("priority", "").lower() == priority.lower()]

        if date_filter:
            results = [t for t in results if t.get("due_date") == date_filter]

        if household_id:
            results = [t for t in results if t.get("household_id") == household_id]

        status_order = {"Due today": 0, "Overdue": 1, "Upcoming": 2, "Completed": 3, "Cancelled": 4}
        results.sort(key=lambda x: (status_order.get(x.get("status"), 5), x.get("due_date", "")))
        return results

    def get_by_id(self, task_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_synced()
        if self._firestore.is_connected:
            try:
                doc = self._firestore.get(task_id)
                if doc:
                    return doc
            except Exception as e:
                logger.warning(f"Error fetching task {task_id} from Firestore: {e}")

        for t in self._tasks:
            if t["id"] == task_id:
                return t
        return None

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        self._ensure_synced()
        new_id = data.get("id") or f"task_{uuid.uuid4().hex[:10]}"
        now_iso = datetime.now().isoformat() + "Z"

        record = {
            "id": new_id,
            "household_id": data["household_id"],
            "household_name": data.get("household_name", "Household"),
            "beneficiary_name": data.get("beneficiary_name"),
            "assigned_asha_id": data.get("assigned_asha_id", "asha_sunita_001"),
            "village": data.get("village", "Rampur Kalan"),
            "task_type": data.get("task_type", "Household visit"),
            "description": data["description"],
            "due_date": data["due_date"],
            "priority": data.get("priority", "Medium"),
            "status": "Due today" if data["due_date"] == str(date.today()) else "Upcoming",
            "created_from": data.get("created_from", "Manual"),
            "completion_notes": None,
            "created_at": now_iso,
            "updated_at": now_iso
        }

        if self._firestore.is_connected:
            self._firestore.set(new_id, record)
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot create task.")

        self._tasks.insert(0, record)
        return record

    def update(self, task_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        record = self.get_by_id(task_id)
        if not record:
            return None
        
        for k, v in data.items():
            if v is not None:
                record[k] = v
        record["updated_at"] = datetime.now().isoformat() + "Z"

        if self._firestore.is_connected:
            self._firestore.set(task_id, record, merge=True)
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot update task.")

        return record

    def complete(self, task_id: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        record = self.get_by_id(task_id)
        if not record:
            return None
        record["status"] = "Completed"
        record["completion_notes"] = notes or "Marked as completed by ASHA worker"
        record["updated_at"] = datetime.now().isoformat() + "Z"

        if self._firestore.is_connected:
            self._firestore.set(task_id, record, merge=True)
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot complete task.")

        return record

    def reschedule(self, task_id: str, new_due_date: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        record = self.get_by_id(task_id)
        if not record:
            return None
        record["due_date"] = new_due_date
        record["status"] = "Due today" if new_due_date == str(date.today()) else "Upcoming"
        if notes:
            record["completion_notes"] = f"Rescheduled: {notes}"
        record["updated_at"] = datetime.now().isoformat() + "Z"

        if self._firestore.is_connected:
            self._firestore.set(task_id, record, merge=True)

        return record

    def delete(self, task_id: str) -> bool:
        record = self.get_by_id(task_id)
        if not record:
            return False
        if self._firestore.is_connected:
            self._firestore.delete(task_id)
        self._tasks = [t for t in self._tasks if t.get("id") != task_id]
        return True

task_repo = TaskRepository()

