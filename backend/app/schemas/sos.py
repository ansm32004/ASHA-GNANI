from pydantic import BaseModel, Field
from typing import Optional

class SosCreateRequest(BaseModel):
    household_id: Optional[str] = None
    household_name: Optional[str] = None
    beneficiary_name: Optional[str] = None
    emergency_type: str = "Immediate Emergency"  # Immediate Emergency, Urgent Health Concern, Routine Assistance
    description: str
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    consent_given: bool = True

class SosActionRequest(BaseModel):
    action: Optional[str] = "acknowledge"  # acknowledge, escalate, resolve
    notes: Optional[str] = None

class SosResponse(BaseModel):
    id: str
    household_id: Optional[str] = None
    household_name: Optional[str] = None
    beneficiary_name: Optional[str] = None
    emergency_type: str
    description: str
    status: str  # Triggered, Acknowledged, Escalated, Resolved
    call_112_initiated: bool
    asha_notified: bool
    escalation_level: int  # 1 (ASHA), 2 (ANM/PHC), 3 (Emergency Ambulance 108/112)
    timestamp: str
    resolved_at: Optional[str] = None
    notes: Optional[str] = None
