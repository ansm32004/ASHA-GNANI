from pydantic import BaseModel, Field
from typing import Optional

class TaskCreate(BaseModel):
    household_id: str
    beneficiary_name: Optional[str] = None
    task_type: str  # Household visit, Maternal health follow-up, Child health follow-up, Vaccination reminder, Health camp, Community request, Documentation pending, Referral follow-up
    description: str
    due_date: str  # YYYY-MM-DD
    priority: str = "Medium"  # Urgent, High, Medium, Low
    created_from: Optional[str] = "Manual"  # Visit, Request, Camp, Manual

class TaskUpdate(BaseModel):
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None  # Upcoming, Due today, Overdue, Completed, Cancelled
    completion_notes: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    household_id: str
    household_name: str
    beneficiary_name: Optional[str] = None
    village: Optional[str] = None
    task_type: str
    description: str
    due_date: str
    priority: str
    status: str
    created_from: str
    completion_notes: Optional[str] = None
    created_at: str
    updated_at: str

