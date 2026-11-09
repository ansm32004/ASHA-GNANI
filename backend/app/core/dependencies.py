from fastapi import Depends, Header, HTTPException, status
from typing import Optional
from app.config import settings
from app.core.security import verify_token
from app.core.exceptions import UnauthorizedException

def is_demo_auth_allowed() -> bool:
    return bool(settings.DEMO_MODE and str(settings.ENVIRONMENT).lower() != "production")

def get_token_from_header(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        if is_demo_auth_allowed():
            return "demo_token"
        raise UnauthorizedException("Missing authorization header")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException("Invalid authorization header format. Use 'Bearer <token>'")
    
    return parts[1]

def get_current_user_id(token: str = Depends(get_token_from_header)) -> str:
    demo_allowed = is_demo_auth_allowed()
    if token == "demo_token":
        if demo_allowed:
            return "asha_sunita_001"
        raise UnauthorizedException("Demo authentication is disabled in production")
    
    user_id = verify_token(token)
    if not user_id:
        if demo_allowed and (token.startswith("demo_token_") or token == "mock_jwt_token_asha"):
            if "comm" in token:
                return "comm_meena_001"
            return "asha_sunita_001"
        raise UnauthorizedException("Invalid or expired session token")
    return user_id

