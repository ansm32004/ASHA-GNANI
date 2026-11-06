from typing import List, Optional, Dict, Any
from app.repositories.task_repository import task_repo
from app.repositories.household_repository import household_repo
from app.core.exceptions import NotFoundException, ValidationException

class TaskService:
    def list_tasks(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        date_filter: Optional[str] = None,
        household_id: Optional[str] = None,
        assigned_asha_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return task_repo.list_all(
            status=status,
            priority=priority,
            date_filter=date_filter,
            household_id=household_id,
            assigned_asha_id=assigned_asha_id
        )

    def get_task(self, task_id: str) -> Dict[str, Any]:
        task = task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task", task_id)
        return task

    def create_task(self, data: Dict[str, Any], asha_id: Optional[str] = None) -> Dict[str, Any]:
        if asha_id:
            data["assigned_asha_id"] = asha_id
        hh = household_repo.get_by_id(data["household_id"])
        if hh:
            data["household_name"] = hh.get("primary_contact_name", "Household")
            data["village"] = hh.get("village", "Rampur Kalan")
        return task_repo.create(data)

    def update_task(self, task_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        updated = task_repo.update(task_id, data)
        if not updated:
            raise NotFoundException("Task", task_id)
        return updated

    def complete_task(self, task_id: str, notes: Optional[str] = None) -> Dict[str, Any]:
        task = task_repo.complete(task_id, notes)
        if not task:
            raise NotFoundException("Task", task_id)
        return task

    def reschedule_task(self, task_id: str, new_due_date: str, notes: Optional[str] = None) -> Dict[str, Any]:
        task = task_repo.reschedule(task_id, new_due_date, notes)
        if not task:
            raise NotFoundException("Task", task_id)
        return task

    def delete_task(self, task_id: str) -> bool:
        deleted = task_repo.delete(task_id)
        if not deleted:
            raise NotFoundException("Task", task_id)
        return True

task_service = TaskService()

