from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

class MemberExtraction(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    relation: Optional[str] = None
    category: Optional[str] = None
    is_high_risk: Optional[bool] = None

class HouseholdRegistrationExtraction(BaseModel):
    household_head_name: Optional[str] = None
    address: Optional[str] = None
    village: Optional[str] = None
    contact_number: Optional[str] = None
    member_count: Optional[int] = None
    members: List[MemberExtraction] = []
    notes: Optional[str] = None

class VisitLoggingExtraction(BaseModel):
    beneficiary_name: Optional[str] = None
    household_id: Optional[str] = None
    household_name: Optional[str] = None
    visit_date: Optional[str] = None
    activity_category: Optional[str] = None  # Maternal Health, Child Health, Immunisation, Nutrition, General
    activity_description: Optional[str] = None
    services_provided: List[str] = []
    visit_outcome: Optional[str] = None  # Normal, Requires Monitoring, Referred to PHC, Medicine Taken
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[str] = None
    priority: Optional[str] = None  # Urgent, Priority, Routine
    notes: Optional[str] = None

class PregnancyTrackingExtraction(BaseModel):
    beneficiary_name: Optional[str] = None
    household_id: Optional[str] = None
    pregnancy_duration: Optional[str] = None  # e.g., "6 months", "32 weeks"
    pregnancy_month: Optional[int] = None
    anc_visit_number: Optional[int] = None
    recorded_health_measurements: Dict[str, Any] = {}  # bp, weight_kg, hemoglobin
    ifa_tablets_provided: Optional[int] = None
    danger_signs_observed: List[str] = []
    high_risk_flag: Optional[bool] = None
    high_risk_reason: Optional[str] = None
    follow_up_required: Optional[bool] = None
    next_visit_date: Optional[str] = None
    notes: Optional[str] = None

class ChildHealthExtraction(BaseModel):
    child_name: Optional[str] = None
    mother_or_guardian_name: Optional[str] = None
    household_id: Optional[str] = None
    age: Optional[str] = None
    recorded_weight_kg: Optional[float] = None
    vaccinations_given: List[str] = []
    vaccinations_due: List[str] = []
    nutrition_observations: Optional[str] = None
    illness_symptoms: List[str] = []
    follow_up_required: Optional[bool] = None
    next_visit_date: Optional[str] = None
    notes: Optional[str] = None

class FollowUpTaskExtraction(BaseModel):
    beneficiary_name: Optional[str] = None
    household_id: Optional[str] = None
    task_type: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None  # Urgent, High, Medium, Low
    status: Optional[str] = "Upcoming"

class CommunityRequestExtraction(BaseModel):
    request_category: Optional[str] = None
    description: Optional[str] = None
    household_reference: Optional[str] = None
    beneficiary_name: Optional[str] = None
    urgency: Optional[str] = None
    follow_up_required: Optional[bool] = None

class ExtractionRequest(BaseModel):
    transcript: str
    task_type: str = "visit_logging"  # visit_logging, household_registration, pregnancy_tracking, child_health, follow_up_task, community_request
    household_id: Optional[str] = None
    language: Optional[str] = "hi"

class ExtractionResponse(BaseModel):
    task_type: str
    extracted_fields: Dict[str, Any]
    confidence_score: float = 0.95
    raw_transcript: str
    requires_user_confirmation: bool = True
    missing_fields: List[str] = []
    model_used: str = "gemini-1.5-flash"

