import os
import json
import hashlib
import uuid
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Union
from jose import jwt, JWTError
from app.config import settings

REVOKED_TOKENS = set()
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
REVOCATION_FILE = os.path.join(DATA_DIR, "revoked_tokens.json")

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def _is_sha256(val: str) -> bool:
    return bool(isinstance(val, str) and len(val) == 64 and all(c in "0123456789abcdefABCDEF" for c in val))

def _load_revocations() -> None:
    try:
        if os.path.exists(REVOCATION_FILE):
            with open(REVOCATION_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    needs_rewrite = False
                    for item in data:
                        if isinstance(item, str) and item.strip():
                            clean = item.strip()
                            if _is_sha256(clean):
                                REVOKED_TOKENS.add(clean.lower())
                            else:
                                # Legacy raw token encountered: hash and store hash only
                                REVOKED_TOKENS.add(_hash_token(clean))
                                needs_rewrite = True
                    if needs_rewrite:
                        _persist_revocations()
    except Exception:
        pass

def _persist_revocations() -> None:
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(REVOCATION_FILE, "w", encoding="utf-8") as f:
            # Store only unique, verified SHA-256 token hashes
            json.dump(sorted([t for t in REVOKED_TOKENS if _is_sha256(t)]), f)
    except Exception:
        pass

_load_revocations()

def revoke_token(token: str) -> None:
    if token:
        token_hash = _hash_token(token)
        REVOKED_TOKENS.add(token_hash)
        _persist_revocations()
        try:
            from app.integrations.firebase.firestore_repository import FirestoreRepository
            fs_revoked = FirestoreRepository("revoked_tokens")
            if fs_revoked.is_connected:
                fs_revoked.set(token_hash, {
                    "token_hash": token_hash,
                    "revoked_at": datetime.now(timezone.utc).isoformat()
                })
        except Exception:
            pass

def is_token_revoked(token: str) -> bool:
    if not token:
        return True
    token_hash = _hash_token(token)
    return token_hash in REVOKED_TOKENS

def create_access_token(
    subject: Union[str, Any],
    role: Optional[str] = None,
    household_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "jti": uuid.uuid4().hex
    }
    if role:
        to_encode["role"] = role
    if household_id:
        to_encode["household_id"] = household_id
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    if is_token_revoked(token):
        return None
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return decoded_token["sub"]
    except JWTError:
        return None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if not plain_password or not hashed_password:
            return False
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


