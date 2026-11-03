from typing import List, Optional, Dict, Any
from app.repositories.sos_repository import sos_repo
from app.repositories.household_repository import household_repo
from app.core.exceptions import NotFoundException, ValidationException

class SosService:
    def list_events(self) -> List[Dict[str, Any]]:
        return sos_repo.list_all()

    def get_event(self, event_id: str) -> Dict[str, Any]:
        event = sos_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException("SOS Event", event_id)
        return event

    def trigger_sos(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if data.get("household_id"):
            hh = household_repo.get_by_id(data["household_id"])
            if hh:
                data["household_name"] = hh["primary_contact_name"]
        return sos_repo.create(data)

    def acknowledge_sos(self, event_id: str, notes: Optional[str] = None) -> Dict[str, Any]:
        event = sos_repo.acknowledge(event_id, notes)
        if not event:
            raise NotFoundException("SOS Event", event_id)
        return event

    def escalate_sos(self, event_id: str, notes: Optional[str] = None) -> Dict[str, Any]:
        event = sos_repo.escalate(event_id, notes)
        if not event:
            raise NotFoundException("SOS Event", event_id)
        return event

sos_service = SosService()

