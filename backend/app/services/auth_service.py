from typing import Dict, Any, Optional
import uuid
from app.repositories.mock_data import DEMO_USER, DEMO_ASHA_USER, DEMO_COMMUNITY_USER
from app.core.security import create_access_token
from app.core.exceptions import UnauthorizedException, ValidationException

class AuthService:
    def __init__(self):
        self._pending_otps: Dict[str, str] = {
            "demo_session": "123456"
        }

    def login_with_credentials(self, email: str, password: str, role: Optional[str] = None) -> Dict[str, Any]:
        clean_email = email.strip().lower()
        if password != "Sahayika@123":
            raise UnauthorizedException("Invalid credentials. For demo accounts use password: Sahayika@123")
        
        if "community" in clean_email or role == "COMMUNITY":
            user = DEMO_COMMUNITY_USER
        else:
            user = DEMO_ASHA_USER
            
        token = create_access_token(subject=user["id"])
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user
        }

    def request_otp(self, phone_number: str) -> Dict[str, Any]:
        clean_phone = phone_number.replace(" ", "").replace("+91", "").strip()
        if len(clean_phone) != 10 or not clean_phone.isdigit():
            raise ValidationException("Please enter a valid 10-digit Indian mobile number")
        
        session_id = f"sess_{uuid.uuid4().hex[:12]}"
        # For development / demo mode: 123456 is standard mock OTP
        mock_otp = "123456"
        self._pending_otps[session_id] = mock_otp
        
        return {
            "session_id": session_id,
            "message": f"OTP successfully sent to +91 {clean_phone}",
            "is_demo": True,
            "otp_sent": True,
            "hint": "Demo OTP is 123456"
        }

    def verify_otp(self, session_id: str, phone_number: str, otp: str) -> Dict[str, Any]:
        # Accept mock OTP 123456 in demo mode or matching session OTP
        expected_otp = self._pending_otps.get(session_id, "123456")
        if otp != expected_otp and otp != "123456":
            raise UnauthorizedException("Invalid OTP code. Please enter 123456 for demo login.")

        # Create session token
        token = create_access_token(subject=DEMO_USER["id"])
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": DEMO_USER
        }

    def get_current_user_profile(self, user_id: str) -> Dict[str, Any]:
        if user_id and user_id.startswith("comm_"):
            return DEMO_COMMUNITY_USER
        return DEMO_ASHA_USER

auth_service = AuthService()

