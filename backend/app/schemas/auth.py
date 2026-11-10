from pydantic import BaseModel, Field
from typing import Optional, List

class LoginRequest(BaseModel):
    phone_number: str = Field(..., description="10-digit mobile number, e.g. 9876543210")
    role: str = Field("ASHA", description="User role, default ASHA")

class CredentialsLoginRequest(BaseModel):
    email: str = Field(..., description="Demo email: asha.demo@sahayika.test or community.demo@sahayika.test")
    password: str = Field("Sahayika@123", description="Password")
    role: Optional[str] = Field(None, description="ASHA or COMMUNITY")

class RegisterRequest(BaseModel):
    role: str = Field(..., description="Role: ASHA or COMMUNITY")
    name: str = Field(..., min_length=2, description="Full Name")
    email: str = Field(..., description="Email address")
    phone: str = Field(..., min_length=10, max_length=15, description="Phone number")
    password: str = Field(..., min_length=8, description="Password (min 8 chars)")
    
    # Common demographics
    dob: Optional[str] = Field(None, description="Date of birth")
    gender: Optional[str] = Field(None, description="Gender")
    address: Optional[str] = Field(None, description="Street address")
    state: str = Field(default="Uttar Pradesh", description="State")
    district: str = Field(default="Varanasi", description="District")
    village_name: str = Field(..., description="Village / Assigned Area")
    
    # ASHA-specific fields
    asha_id: Optional[str] = Field(None, description="ASHA Worker ID / Badge ID")
    block: Optional[str] = Field(None, description="Block / Sub-district")
    sub_centre: Optional[str] = Field(None, description="Sub-Centre name")
    phc_name: Optional[str] = Field(None, description="Primary Health Centre")
    
    # Community-specific fields
    household_code: Optional[str] = Field(None, description="Household Code or Family ID")
    sub_area: Optional[str] = Field(None, description="Ward or Sub-area")


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
    asha_id: Optional[str] = None
    village_name: str
    sub_centre: Optional[str] = None
    phc_name: Optional[str] = None
    district: str
    state: str
    assigned_clusters: List[str] = Field(default_factory=list)
    preferred_ui_language: str = "hi"
    preferred_voice_language: str = "hi"
    total_assigned_households: int = 42
    profile_photo_url: Optional[str] = None

class VerifyOtpResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

