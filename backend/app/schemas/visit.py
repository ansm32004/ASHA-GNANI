from pydantic import BaseModel, Field
from typing import Optional, List

class VisitDraftRequest(BaseModel):
    household_id: str
    beneficiary_id: Optional[str] = None
    audio_duration_seconds: Optional[int] = 0
    raw_notes: Optional[str] = None
    speech_transcript: Optional[str] = None

class ExtractedVisitFields(BaseModel):
    household_id: str
    household_name: Optional[str] = None
    beneficiary_name: Optional[str] = None
    visit_date: str
    activity_category: str  # Maternal Health, Child Health, Immunisation, Nutrition, Sanitation, General
    activity_description: str
    visit_outcome: str  # Normal, Requires Monitoring, Referred to PHC, Medicine Taken
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    priority: str = "Routine"  # Urgent, Priority, Routine
    notes: Optional[str] = None

class VisitConfirmRequest(BaseModel):
    household_id: str
    beneficiary_name: Optional[str] = None
    visit_date: str
    activity_category: str
    activity_description: str
    visit_outcome: str
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    priority: str = "Routine"
    notes: Optional[str] = None
    auto_create_task: bool = True

class VisitResponse(BaseModel):
    id: str
    household_id: str
    household_name: Optional[str] = None
    beneficiary_name: Optional[str] = None
    visit_date: str
    activity_category: str
    activity_description: str
    visit_outcome: str
    follow_up_required: bool
    follow_up_date: Optional[str] = None
    priority: str
    notes: Optional[str] = None
    status: str = "Confirmed"  # Draft, Awaiting Confirmation, Confirmed, Verified
    created_task_id: Optional[str] = None
    created_at: str
    synced: bool = True

