from typing import List, Optional, Dict, Any
from app.repositories.mock_data import generate_mock_households, DEMO_USER
from datetime import datetime
import uuid

class HouseholdRepository:
    def __init__(self):
        # In-memory working database initialized from realistic mock data
        self._households: List[Dict[str, Any]] = generate_mock_households()

    def list_all(
        self,
        search: Optional[str] = None,
        village: Optional[str] = None,
        priority: Optional[str] = None,
        has_pending: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        results = self._households.copy()

        if search:
            q = search.lower().strip()
            results = [
                h for h in results
                if q in h["primary_contact_name"].lower()
                or q in h["household_id"].lower()
                or any(q in m["name"].lower() for m in h.get("members", []))
            ]

        if village and village != "All":
            results = [h for h in results if h["village"].lower() == village.lower()]

        if priority and priority != "All":
            results = [h for h in results if h.get("priority", "").lower() == priority.lower()]

        if has_pending is not None:
            if has_pending:
                results = [h for h in results if h.get("pending_tasks_count", 0) > 0]
            else:
                results = [h for h in results if h.get("pending_tasks_count", 0) == 0]

        return results

    def get_by_id(self, household_id: str) -> Optional[Dict[str, Any]]:
        for h in self._households:
            if h["id"] == household_id or h["household_id"] == household_id:
                return h
        return None

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        new_id = f"hh_{len(self._households) + 1:03d}"
        v = data.get("village", "Rampur Kalan")
        hh_code = data.get("household_id") or f"HH-{v[:2].upper()}-{len(self._households) + 1:03d}"
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
            "assigned_asha_id": DEMO_USER["id"],
            "last_visit_date": None,
            "next_follow_up": None,
            "pending_tasks_count": 0,
            "created_at": now_iso,
            "updated_at": now_iso,
            "members": data.get("members", [])
        }
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
        return record

    def update_visit_and_followup(self, household_id: str, visit_date: str, next_followup: Optional[str]):
        record = self.get_by_id(household_id)
        if record:
            record["last_visit_date"] = visit_date
            if next_followup:
                record["next_follow_up"] = next_followup
                record["pending_tasks_count"] = record.get("pending_tasks_count", 0) + 1
            record["updated_at"] = datetime.now().isoformat() + "Z"

household_repo = HouseholdRepository()

