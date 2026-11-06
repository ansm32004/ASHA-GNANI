from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class BeneficiaryMember(BaseModel):
    id: str
    name: str
    age: Optional[int] = 0
    gender: str = "Female"  # Female, Male, Other
    relation: str = "Self"  # Head, Wife, Son, Daughter, Mother, etc.
    category: Optional[str] = "General"  # Pregnant Woman, Lactating Mother, Infant, Child (1-5), Adolescent, Elder, General
    rch_id: Optional[str] = None  # Reproductive & Child Health ID
    is_high_risk: bool = False
    high_risk_reason: Optional[str] = None
    pregnancy_month: Optional[int] = None
    expected_delivery_date: Optional[str] = None
    last_vaccination_date: Optional[str] = None
    next_due_vaccine: Optional[str] = None

class HouseholdCreate(BaseModel):
    household_id: Optional[str] = None
    primary_contact_name: str
    village: str
    sub_area: Optional[str] = None
    contact_number: str
    preferred_language: str = "hi"
    address: Optional[str] = None
    consent_status: bool = True
    members: List[BeneficiaryMember] = []

class HouseholdUpdate(BaseModel):
    primary_contact_name: Optional[str] = None
    village: Optional[str] = None
    sub_area: Optional[str] = None
    contact_number: Optional[str] = None
    preferred_language: Optional[str] = None
    address: Optional[str] = None
    consent_status: Optional[bool] = None

class HouseholdResponse(BaseModel):
    id: str
    household_id: str
    primary_contact_name: str
    village: str
    sub_area: Optional[str] = None
    contact_number: str
    preferred_language: str
    address: Optional[str] = None
    consent_status: bool
    members_count: int
    members: List[BeneficiaryMember] = []
    last_visit_date: Optional[str] = None
    next_follow_up: Optional[str] = None
    pending_tasks_count: int = 0
    priority: str = "Routine"  # Urgent, Priority, Routine
    assigned_asha_id: str
    created_at: str
    updated_at: str

