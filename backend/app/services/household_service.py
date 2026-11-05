from typing import List, Optional, Dict, Any
from app.repositories.household_repository import household_repo
from app.core.exceptions import NotFoundException, ValidationException

class HouseholdService:
    def list_households(
        self,
        search: Optional[str] = None,
        village: Optional[str] = None,
        priority: Optional[str] = None,
        has_pending: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        return household_repo.list_all(search=search, village=village, priority=priority, has_pending=has_pending)

    def get_household(self, household_id: str) -> Dict[str, Any]:
        hh = household_repo.get_by_id(household_id)
        if not hh:
            raise NotFoundException("Household", household_id)
        return hh

    def create_household(self, data: Dict[str, Any], asha_id: Optional[str] = None) -> Dict[str, Any]:
        if not data.get("primary_contact_name"):
            raise ValidationException("Primary contact name is required")
        if not data.get("contact_number"):
            raise ValidationException("Contact number is required")
        return household_repo.create(data, asha_id=asha_id)

    def update_household(self, household_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        updated = household_repo.update(household_id, data)
        if not updated:
            raise NotFoundException("Household", household_id)
        return updated

    def delete_household(self, household_id: str) -> bool:
        deleted = household_repo.delete(household_id)
        if not deleted:
            raise NotFoundException("Household", household_id)
        return True

household_service = HouseholdService()

