from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.task import TaskResponse, TaskCreate, TaskUpdate
from app.services.task_service import task_service
from app.core.dependencies import get_current_user_id

router = APIRouter(prefix="/tasks", tags=["Tasks"])

class CompleteTaskRequest(BaseModel):
    notes: Optional[str] = None

class RescheduleTaskRequest(BaseModel):
    new_due_date: str
    notes: Optional[str] = None

@router.get("", response_model=List[TaskResponse])
def get_tasks(
    status: Optional[str] = Query(None, description="Due today, Upcoming, Overdue, Completed"),
    priority: Optional[str] = Query(None, description="Urgent, High, Medium, Low"),
    date_filter: Optional[str] = Query(None, description="YYYY-MM-DD"),
    household_id: Optional[str] = Query(None),
    current_user: str = Depends(get_current_user_id)
):
    """
    List follow-up tasks and scheduled visits with status/priority filtering.
    """
    return task_service.list_tasks(
        status=status,
        priority=priority,
        date_filter=date_filter,
        household_id=household_id
    )

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, current_user: str = Depends(get_current_user_id)):
    """
    Manually create a new task or follow-up reminder.
    """
    return task_service.create_task(payload.model_dump())

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, payload: TaskUpdate, current_user: str = Depends(get_current_user_id)):
    """
    Update task details or status.
    """
    return task_service.update_task(task_id, payload.model_dump(exclude_unset=True))

@router.post("/{task_id}/complete", response_model=TaskResponse)
def complete_task(task_id: str, payload: CompleteTaskRequest = None, current_user: str = Depends(get_current_user_id)):
    """
    Mark a task as completed with optional completion notes.
    """
    notes = payload.notes if payload else None
    return task_service.complete_task(task_id, notes=notes)

@router.post("/{task_id}/reschedule", response_model=TaskResponse)
def reschedule_task(task_id: str, payload: RescheduleTaskRequest, current_user: str = Depends(get_current_user_id)):
    """
    Reschedule task to a new due date.
    """
    return task_service.reschedule_task(task_id, payload.new_due_date, payload.notes)

