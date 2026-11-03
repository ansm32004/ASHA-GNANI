from typing import List, Optional, Dict, Any
from app.repositories.mock_data import generate_mock_requests
from datetime import datetime

class RequestRepository:
    def __init__(self):
        self._requests: List[Dict[str, Any]] = generate_mock_requests()

    def list_all(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        results = self._requests.copy()
        if status and status != "All":
            results = [r for r in results if r.get("status", "").lower() == status.lower()]
        if category and category != "All":
            results = [r for r in results if r.get("category", "").lower() == category.lower()]
        if priority and priority != "All":
            results = [r for r in results if r.get("priority", "").lower() == priority.lower()]

        # Sort: Urgent first, New/Acknowledged before Resolved
        priority_map = {"Urgent": 0, "High": 1, "Medium": 2, "Low": 3}
        status_map = {"New": 0, "Acknowledged": 1, "In progress": 2, "Escalated": 3, "Resolved": 4}
        results.sort(key=lambda x: (status_map.get(x.get("status"), 5), priority_map.get(x.get("priority"), 5)))
        return results

    def get_by_id(self, req_id: str) -> Optional[Dict[str, Any]]:
        for r in self._requests:
            if r["id"] == req_id:
                return r
        return None

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        new_id = f"req_{len(self._requests) + 1:03d}"
        now_iso = datetime.now().isoformat() + "Z"

        record = {
            "id": new_id,
            "household_id": data["household_id"],
            "household_name": data.get("household_name", "Household"),
            "beneficiary_name": data.get("beneficiary_name"),
            "contact_number": data.get("contact_number", "9871100000"),
            "village": data.get("village", "Rampur Kalan"),
            "category": data["category"],
            "description": data["description"],
            "time_received": "Just now",
            "priority": data.get("priority", "Medium"),
            "status": "New",
            "response_history": [f"Request logged at {datetime.now().strftime('%H:%M')}"],
            "created_at": now_iso,
            "updated_at": now_iso
        }
        self._requests.insert(0, record)
        return record

    def update_action(self, req_id: str, action: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        record = self.get_by_id(req_id)
        if not record:
            return None
        
        now_str = datetime.now().strftime("%d %b %H:%M")
        if action.lower() == "acknowledge":
            record["status"] = "Acknowledged"
            msg = f"Acknowledged by ASHA at {now_str}" + (f": {notes}" if notes else "")
            record["response_history"].append(msg)
        elif action.lower() in ["schedule", "scheduled"]:
            record["status"] = "Scheduled"
            msg = f"Visit scheduled by ASHA at {now_str}" + (f": {notes}" if notes else "")
            record["response_history"].append(msg)
        elif action.lower() == "resolve":
            record["status"] = "Resolved"
            msg = f"Resolved at {now_str}" + (f": {notes}" if notes else "")
            record["response_history"].append(msg)
        elif action.lower() == "escalate":
            record["status"] = "Escalated"
            msg = f"Escalated to ANM/MO at {now_str}" + (f": {notes}" if notes else "")
            record["response_history"].append(msg)
        elif action.lower() == "in_progress":
            record["status"] = "In progress"
            msg = f"Action started at {now_str}" + (f": {notes}" if notes else "")
            record["response_history"].append(msg)

        record["updated_at"] = datetime.now().isoformat() + "Z"
        return record

request_repo = RequestRepository()

