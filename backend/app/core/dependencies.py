from fastapi import Depends, Header, HTTPException, status
from typing import Optional
from app.core.security import verify_token
from app.core.exceptions import UnauthorizedException

def get_token_from_header(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        # In demo mode, if no auth token is provided, allow demo fallback user
        return "demo_token"
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException("Invalid authorization header format. Use 'Bearer <token>'")
    
    return parts[1]

def get_current_user_id(token: str = Depends(get_token_from_header)) -> str:
    if token == "demo_token":
        return "asha_sunita_001"
    
    user_id = verify_token(token)
    if not user_id:
        # In demo mode allow demo token
        if token.startswith("demo_token_") or token == "mock_jwt_token_asha":
            return "asha_sunita_001"
        raise UnauthorizedException("Invalid or expired session token")
    return user_id

