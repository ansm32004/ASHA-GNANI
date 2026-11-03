from typing import List, Optional, Dict, Any
from app.repositories.mock_data import generate_mock_visits
from datetime import datetime

class VisitRepository:
    def __init__(self):
        self._visits: List[Dict[str, Any]] = generate_mock_visits()

    def list_all(
        self,
        household_id: Optional[str] = None,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        results = self._visits.copy()
        if household_id:
            results = [v for v in results if v.get("household_id") == household_id]
        if category and category != "All":
            results = [v for v in results if v.get("activity_category", "").lower() == category.lower()]
        results.sort(key=lambda x: x.get("visit_date", ""), reverse=True)
        return results

    def get_by_id(self, visit_id: str) -> Optional[Dict[str, Any]]:
        for v in self._visits:
            if v["id"] == visit_id:
                return v
        return None

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
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
        self._visits.insert(0, record)
        return record

visit_repo = VisitRepository()

