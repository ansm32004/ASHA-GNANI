from fastapi import APIRouter, Depends, status
from app.schemas.auth import LoginRequest, LoginResponse, VerifyOtpRequest, VerifyOtpResponse, UserProfile, CredentialsLoginRequest, RegisterRequest
from app.services.auth_service import auth_service
from app.core.dependencies import get_current_user_id, get_token_from_header

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    """
    Role-based signup for ASHA Worker or Community Member.
    Immediate registration and JWT issuance upon success.
    """
    return auth_service.register(payload)

@router.post("/login-credentials")

def login_credentials(payload: CredentialsLoginRequest):
    """
    Direct credentials login for ASHA and Community demo accounts.
    - ASHA: asha.demo@sahayika.test / Sahayika@123
    - Community: community.demo@sahayika.test / Sahayika@123
    """
    return auth_service.login_with_credentials(payload.email, payload.password, payload.role)

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    """
    Request OTP verification code for ASHA worker mobile number.
    In development / demo mode, code is always 123456.
    """
    return auth_service.request_otp(payload.phone_number)

@router.post("/verify", response_model=VerifyOtpResponse)
def verify_otp(payload: VerifyOtpRequest):
    """
    Verify OTP and obtain JWT access token with ASHA profile.
    """
    return auth_service.verify_otp(payload.session_id, payload.phone_number, payload.otp)

@router.get("/me", response_model=UserProfile)
def get_current_profile(user_id: str = Depends(get_current_user_id)):
    """
    Get current logged in ASHA worker profile and assigned village data.
    """
    return auth_service.get_current_user_profile(user_id)

@router.post("/logout")
def logout(user_id: str = Depends(get_current_user_id), token: str = Depends(get_token_from_header)):
    """
    Revoke current JWT access token and invalidate user session.
    """
    auth_service.revoke_token(token)
    return {"message": "Successfully logged out. Session invalidated.", "user_id": user_id}

