from typing import List, Optional, Dict, Any
from app.repositories.visit_repository import visit_repo
from app.repositories.task_repository import task_repo
from app.repositories.household_repository import household_repo
from app.core.exceptions import NotFoundException, ValidationException

class VisitService:
    def list_visits(self, household_id: Optional[str] = None, category: Optional[str] = None) -> List[Dict[str, Any]]:
        return visit_repo.list_all(household_id=household_id, category=category)

    def get_visit(self, visit_id: str) -> Dict[str, Any]:
        visit = visit_repo.get_by_id(visit_id)
        if not visit:
            raise NotFoundException("Visit", visit_id)
        return visit

    def confirm_visit(self, data: Dict[str, Any]) -> Dict[str, Any]:
        household_id = data["household_id"]
        hh = household_repo.get_by_id(household_id)
        hh_name = hh["primary_contact_name"] if hh else "Household"
        village = hh.get("village", "Rampur Kalan") if hh else "Rampur Kalan"

        created_task_id = None

        # If follow up required, automatically create a task
        if data.get("follow_up_required") and data.get("follow_up_date"):
            task_payload = {
                "household_id": household_id,
                "household_name": hh_name,
                "beneficiary_name": data.get("beneficiary_name") or hh_name,
                "village": village,
                "task_type": f"{data.get('activity_category', 'Household')} follow-up",
                "description": f"Follow-up: {data.get('activity_description', 'Routine check')}",
                "due_date": data["follow_up_date"],
                "priority": data.get("priority", "Priority"),
                "created_from": "Visit"
            }
            new_task = task_repo.create(task_payload)
            created_task_id = new_task["id"]

        visit_data = {
            **data,
            "household_name": hh_name,
            "created_task_id": created_task_id
        }
        confirmed_visit = visit_repo.create(visit_data)

        # Update household record
        household_repo.update_visit_and_followup(
            household_id=household_id,
            visit_date=data["visit_date"],
            next_followup=data.get("follow_up_date") if data.get("follow_up_required") else None
        )

        return confirmed_visit

visit_service = VisitService()

