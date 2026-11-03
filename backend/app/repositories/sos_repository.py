from typing import List, Optional, Dict, Any
from app.repositories.mock_data import generate_mock_sos_events
from datetime import datetime

class SosRepository:
    def __init__(self):
        self._events: List[Dict[str, Any]] = generate_mock_sos_events()

    def list_all(self) -> List[Dict[str, Any]]:
        return self._events

    def get_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        for e in self._events:
            if e["id"] == event_id:
                return e
        return None

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        new_id = f"sos_{len(self._events) + 1:03d}"
        now_iso = datetime.now().isoformat() + "Z"
        is_immediate = data.get("emergency_type") == "Immediate Emergency"

        record = {
            "id": new_id,
            "household_id": data.get("household_id"),
            "household_name": data.get("household_name", "Household"),
            "beneficiary_name": data.get("beneficiary_name"),
            "emergency_type": data.get("emergency_type", "Immediate Emergency"),
            "description": data["description"],
            "status": "Triggered",
            "call_112_initiated": is_immediate,
            "asha_notified": True,
            "escalation_level": 3 if is_immediate else 1,
            "timestamp": now_iso,
            "resolved_at": None,
            "notes": "Emergency alert initiated. In simulation mode: emergency dispatch call 112 simulated, assigned ASHA alerted."
        }
        self._events.insert(0, record)
        return record

    def acknowledge(self, event_id: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        record = self.get_by_id(event_id)
        if not record:
            return None
        record["status"] = "Acknowledged"
        if notes:
            record["notes"] = f"{record['notes']} | Acknowledged: {notes}"
        return record

    def escalate(self, event_id: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        record = self.get_by_id(event_id)
        if not record:
            return None
        record["status"] = "Escalated"
        record["escalation_level"] = min(3, record.get("escalation_level", 1) + 1)
        if notes:
            record["notes"] = f"{record['notes']} | Escalated to level {record['escalation_level']}: {notes}"
        return record

sos_repo = SosRepository()

