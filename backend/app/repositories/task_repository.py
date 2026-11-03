from typing import List, Optional, Dict, Any
from app.repositories.mock_data import generate_mock_tasks
from datetime import datetime, date

class TaskRepository:
    def __init__(self):
        self._tasks: List[Dict[str, Any]] = generate_mock_tasks()

    def list_all(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        date_filter: Optional[str] = None,
        household_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        results = self._tasks.copy()

        if status and status != "All":
            results = [t for t in results if t.get("status", "").lower() == status.lower()]

        if priority and priority != "All":
            results = [t for t in results if t.get("priority", "").lower() == priority.lower()]

        if date_filter:
            results = [t for t in results if t.get("due_date") == date_filter]

        if household_id:
            results = [t for t in results if t.get("household_id") == household_id]

        # Sort: Due today first, then Overdue, then Upcoming, then Completed
        status_order = {"Due today": 0, "Overdue": 1, "Upcoming": 2, "Completed": 3, "Cancelled": 4}
        results.sort(key=lambda x: (status_order.get(x.get("status"), 5), x.get("due_date", "")))
        return results

    def get_by_id(self, task_id: str) -> Optional[Dict[str, Any]]:
        for t in self._tasks:
            if t["id"] == task_id:
                return t
        return None

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        new_id = f"task_{len(self._tasks) + 1:03d}"
        now_iso = datetime.now().isoformat() + "Z"

        record = {
            "id": new_id,
            "household_id": data["household_id"],
            "household_name": data.get("household_name", "Household"),
            "beneficiary_name": data.get("beneficiary_name"),
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
        return record

    def complete(self, task_id: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        record = self.get_by_id(task_id)
        if not record:
            return None
        record["status"] = "Completed"
        record["completion_notes"] = notes or "Marked as completed by ASHA worker"
        record["updated_at"] = datetime.now().isoformat() + "Z"
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
        return record

task_repo = TaskRepository()

