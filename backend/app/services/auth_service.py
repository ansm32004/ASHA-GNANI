from typing import Dict, Any, Optional
import uuid
import re
from datetime import datetime, timezone
from fastapi import status
from app.config import settings
from app.repositories.mock_data import DEMO_USER, DEMO_ASHA_USER, DEMO_COMMUNITY_USER
from app.repositories.user_repository import user_repository
from app.repositories.household_repository import household_repo
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.exceptions import UnauthorizedException, ValidationException, SahayikaException, ConflictException
from app.core.logging import logger
from app.schemas.auth import RegisterRequest

class AuthService:
    def __init__(self):
        self._pending_otps: Dict[str, str] = {
            "demo_session": "123456"
        }

    def register(self, payload: RegisterRequest) -> Dict[str, Any]:
        role = (payload.role or "").strip().upper()
        if role not in ["ASHA", "COMMUNITY"]:
            raise ValidationException("Role must be either ASHA or COMMUNITY.")

        clean_email = (payload.email or "").strip().lower()
        if not clean_email or "@" not in clean_email or "." not in clean_email.split("@")[-1]:
            raise ValidationException("Please provide a valid email address.")

        clean_phone = re.sub(r"\D", "", payload.phone or "")
        if len(clean_phone) > 10 and clean_phone.startswith("91"):
            clean_phone = clean_phone[2:]
        if len(clean_phone) != 10:
            raise ValidationException("Please provide a valid 10-digit mobile number.")

        if not payload.password or len(payload.password) < 8:
            raise ValidationException("Password must be at least 8 characters long.")

        clean_name = (payload.name or "").strip()
        if not clean_name:
            raise ValidationException("Full name is required.")

        clean_village = (payload.village_name or "").strip()
        if not clean_village:
            raise ValidationException("Village or assigned area is required.")

        if not user_repository.is_connected and not settings.DEMO_MODE:
            raise SahayikaException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                message="Authentication database service is currently unavailable. Please try again later."
            )

        # Check for existing email in Firestore
        try:
            existing_user = user_repository.get_by_email(clean_email)
            if existing_user:
                raise ConflictException("A user with this email address already exists. Please sign in instead.")
        except ConflictException:
            raise
        except Exception:
            raise SahayikaException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                message="Unable to verify user registration. Database query failed."
            )

        # Generate unique user id
        user_id = f"asha_{uuid.uuid4().hex[:10]}" if role == "ASHA" else f"comm_{uuid.uuid4().hex[:10]}"
        password_hash = get_password_hash(payload.password)
        now_iso = datetime.now(timezone.utc).isoformat()

        if role == "ASHA":
            asha_badge = (payload.asha_id or "").strip()
            if not asha_badge:
                state_prefix = (payload.state or "UP")[:2].upper()
                dist_prefix = (payload.district or "VNS")[:3].upper()
                asha_badge = f"ASHA-{state_prefix}-{dist_prefix}-{uuid.uuid4().hex[:4].upper()}"

            user_data = {
                "id": user_id,
                "email": clean_email,
                "name": clean_name,
                "phone": clean_phone,
                "role": "ASHA",
                "asha_id": asha_badge,
                "dob": payload.dob or "1990-01-01",
                "gender": payload.gender or "Female",
                "address": payload.address or "",
                "block": payload.block or f"{payload.district} Block",
                "village_name": clean_village,
                "sub_centre": payload.sub_centre or f"{clean_village} SC-01",
                "phc_name": payload.phc_name or f"{payload.district} Primary Health Centre",
                "district": (payload.district or "Varanasi").strip(),
                "state": (payload.state or "Uttar Pradesh").strip(),
                "assigned_clusters": [clean_village],
                "preferred_ui_language": "hi",
                "preferred_voice_language": "hi",
                "total_assigned_households": 0,
                "profile_photo_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
                "password_hash": password_hash,
                "created_at": now_iso
            }
        else:
            hh_id = f"hh_{uuid.uuid4().hex[:8]}"
            hh_code = (payload.household_code or "").strip()
            if not hh_code:
                village_prefix = clean_village[:2].upper()
                hh_code = f"HH-{village_prefix}-{uuid.uuid4().hex[:3].upper()}"

            user_data = {
                "id": user_id,
                "email": clean_email,
                "name": clean_name,
                "phone": clean_phone,
                "role": "COMMUNITY",
                "dob": payload.dob or "1995-01-01",
                "gender": payload.gender or "Female",
                "address": payload.address or "",
                "household_id": hh_id,
                "household_code": hh_code,
                "village_name": clean_village,
                "sub_area": payload.sub_area or payload.address or f"{clean_village} Ward 1",
                "district": (payload.district or "Varanasi").strip(),
                "state": (payload.state or "Uttar Pradesh").strip(),
                "preferred_ui_language": "hi",
                "preferred_voice_language": "hi",
                "assigned_asha": {
                    "id": "asha_sunita_001",
                    "name": "Sunita Devi",
                    "phone": "9876543210",
                    "village": clean_village,
                    "sub_centre": payload.sub_centre or f"{clean_village} SC-01",
                    "phc": payload.phc_name or f"{payload.district} Primary Health Centre"
                },
                "family_members": [
                    {
                        "id": f"mem_{uuid.uuid4().hex[:6]}",
                        "name": clean_name,
                        "relation": "Self",
                        "gender": payload.gender or "Female",
                        "dob": payload.dob or ""
                    }
                ],
                "password_hash": password_hash,
                "created_at": now_iso
            }

        # Save to Firestore
        user_repository.create_user(user_data)

        if role == "COMMUNITY" and user_data.get("household_id"):
            try:
                household_repo.create({
                    "id": user_data["household_id"],
                    "household_id": user_data.get("household_code", f"HH-{clean_village[:2].upper()}-001"),
                    "primary_contact_name": clean_name,
                    "contact_number": clean_phone,
                    "village": clean_village,
                    "sub_area": user_data.get("sub_area", ""),
                    "district": user_data.get("district", "Varanasi"),
                    "state": user_data.get("state", "Uttar Pradesh"),
                    "members": user_data.get("family_members", []),
                    "priority": "Routine",
                    "created_at": now_iso
                }, asha_id="asha_sunita_001")
            except Exception as e:
                logger.warning(f"Could not initialize household record for {clean_email}: {e}")

        # Generate JWT with server-controlled role and household claims
        token = create_access_token(
            subject=user_id,
            role=role,
            household_id=user_data.get("household_id")
        )

        # Safe user without password_hash
        safe_user = {k: v for k, v in user_data.items() if k != "password_hash"}

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": safe_user
        }


    def login_with_credentials(self, email: str, password: str, role: Optional[str] = None) -> Dict[str, Any]:
        clean_email = email.strip().lower() if email else ""
        if not clean_email or not password:
            raise UnauthorizedException("Invalid email or password.")

        if not user_repository.is_connected and not settings.DEMO_MODE:
            raise SahayikaException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                message="Authentication database service is currently unavailable. Please try again later."
            )

        try:
            user = user_repository.get_by_email(clean_email)
        except Exception:
            raise SahayikaException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                message="Unable to reach user authentication database."
            )

        if not user:
            raise UnauthorizedException("Invalid email or password.")

        password_hash = user.get("password_hash")
        if not password_hash or not verify_password(password, password_hash):
            raise UnauthorizedException("Invalid email or password.")

        user_id = str(user.get("id"))
        token = create_access_token(
            subject=user_id,
            role=user.get("role"),
            household_id=user.get("household_id")
        )

        # Do not expose password_hash in response
        safe_user = {k: v for k, v in user.items() if k != "password_hash"}

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": safe_user
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
        try:
            user = user_repository.get_by_id(user_id)
            if user:
                return {k: v for k, v in user.items() if k != "password_hash"}
        except Exception as e:
            logger.warning(f"Error fetching profile for {user_id}: {e}")
        if user_id and user_id.startswith("comm_"):
            return DEMO_COMMUNITY_USER
        return DEMO_ASHA_USER

    def revoke_token(self, token: str) -> None:
        from app.core.security import revoke_token
        revoke_token(token)

auth_service = AuthService()

