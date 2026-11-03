from typing import List, Optional, Dict, Any
from app.repositories.request_repository import request_repo
from app.repositories.household_repository import household_repo
from app.core.exceptions import NotFoundException, ValidationException

class RequestService:
    def list_requests(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return request_repo.list_all(status=status, category=category, priority=priority)

    def get_request(self, req_id: str) -> Dict[str, Any]:
        req = request_repo.get_by_id(req_id)
        if not req:
            raise NotFoundException("Community Request", req_id)
        return req

    def create_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        hh = household_repo.get_by_id(data["household_id"])
        if hh:
            data["household_name"] = hh["primary_contact_name"]
            data["contact_number"] = hh["contact_number"]
            data["village"] = hh.get("village", "Rampur Kalan")
        return request_repo.create(data)

    def process_action(self, req_id: str, action: str, notes: Optional[str] = None) -> Dict[str, Any]:
        updated = request_repo.update_action(req_id, action, notes)
        if not updated:
            raise NotFoundException("Community Request", req_id)
        return updated

request_service = RequestService()

