from pydantic import BaseModel, Field
from typing import Optional, List

class LoginRequest(BaseModel):
    phone_number: str = Field(..., description="10-digit mobile number, e.g. 9876543210")
    role: str = Field("ASHA", description="User role, default ASHA")

class CredentialsLoginRequest(BaseModel):
    email: str = Field(..., description="Demo email: asha.demo@sahayika.test or community.demo@sahayika.test")
    password: str = Field("Sahayika@123", description="Password")
    role: Optional[str] = Field(None, description="ASHA or COMMUNITY")

class LoginResponse(BaseModel):
    session_id: str
    message: str
    is_demo: bool = True
    otp_sent: bool = True
    hint: Optional[str] = None

class VerifyOtpRequest(BaseModel):
    session_id: str
    phone_number: str
    otp: str = Field(..., description="6-digit verification code")

class UserProfile(BaseModel):
    id: str
    name: str
    phone: str
    role: str = "ASHA"
    asha_id: str
    village_name: str
    sub_centre: str
    phc_name: str
    district: str
    state: str
    assigned_clusters: List[str]
    preferred_ui_language: str = "hi"
    preferred_voice_language: str = "hi"
    total_assigned_households: int = 42
    profile_photo_url: Optional[str] = None

class VerifyOtpResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

