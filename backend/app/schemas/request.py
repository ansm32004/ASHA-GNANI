from pydantic import BaseModel, Field
from typing import Optional, List

class RequestCreate(BaseModel):
    household_id: str
    beneficiary_name: Optional[str] = None
    category: str  # Callback, Nutrition information, Vaccination info, Health camp enquiry, Household visit request, Appointment assistance, General assistance, Urgent health concern
    description: str
    priority: str = "Medium"  # Urgent, High, Medium, Low
    preferred_date: Optional[str] = None

class RequestAction(BaseModel):
    action: str  # Acknowledge, Schedule visit, Add follow-up, Escalate, Resolve
    notes: Optional[str] = None

class RequestResponse(BaseModel):
    id: str
    household_id: str
    household_name: str
    beneficiary_name: Optional[str] = None
    contact_number: str
    village: str
    category: str
    description: str
    time_received: str
    priority: str
    status: str  # New, Acknowledged, In progress, Resolved, Escalated
    response_history: List[str] = []
    preferred_date: Optional[str] = None
    created_at: str
    updated_at: str

