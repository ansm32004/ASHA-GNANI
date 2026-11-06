import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch
from app.main import app
from app.integrations.firebase.firebase_admin import firebase_manager
from app.repositories.user_repository import user_repository

@pytest.fixture(autouse=True)
def setup_firebase():
    firebase_manager.initialize()
    user_repository._ensure_initialized()

@pytest.mark.asyncio
async def test_auth_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Step 1: Login request
        login_res = await ac.post("/api/v1/auth/login", json={"phone_number": "9876543210"})
        assert login_res.status_code == 200
        data = login_res.json()
        assert data["is_demo"] is True
        session_id = data["session_id"]

        # Step 2: Verify OTP with standard demo OTP 123456
        verify_res = await ac.post("/api/v1/auth/verify", json={
            "session_id": session_id,
            "phone_number": "9876543210",
            "otp": "123456"
        })
        assert verify_res.status_code == 200
        verify_data = verify_res.json()
        assert "access_token" in verify_data
        assert verify_data["user"]["name"] == "Sunita Devi"
        assert verify_data["user"]["role"] == "ASHA"

        # Step 3: Get me
        token = verify_data["access_token"]
        me_res = await ac.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        me_data = me_res.json()
        assert me_data["name"] == "Sunita Devi"

@pytest.mark.asyncio
async def test_credentials_authentication_full():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Correct ASHA credentials
        asha_res = await ac.post("/api/v1/auth/login-credentials", json={
            "email": "asha.demo@sahayika.test",
            "password": "Sahayika@123"
        })
        assert asha_res.status_code == 200
        asha_data = asha_res.json()
        assert "access_token" in asha_data
        assert asha_data["user"]["role"] == "ASHA"
        assert asha_data["user"]["name"] == "Sunita Devi"
        # Password hash must NEVER be exposed
        assert "password_hash" not in asha_data["user"]
        assert "password" not in asha_data["user"]

        # 2. Verify JWT token works with /auth/me
        token = asha_data["access_token"]
        me_res = await ac.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["name"] == "Sunita Devi"

        # 3. Correct Community credentials
        comm_res = await ac.post("/api/v1/auth/login-credentials", json={
            "email": "community.demo@sahayika.test",
            "password": "Sahayika@123"
        })
        assert comm_res.status_code == 200
        comm_data = comm_res.json()
        assert "access_token" in comm_data
        assert comm_data["user"]["role"] == "COMMUNITY"
        assert comm_data["user"]["name"] == "Meena Devi"
        assert "password_hash" not in comm_data["user"]

        # 4. Incorrect password returns 401
        wrong_pwd_res = await ac.post("/api/v1/auth/login-credentials", json={
            "email": "asha.demo@sahayika.test",
            "password": "WrongPassword123"
        })
        assert wrong_pwd_res.status_code == 401
        assert "access_token" not in wrong_pwd_res.json()

        # 5. Unknown email returns 401
        unknown_res = await ac.post("/api/v1/auth/login-credentials", json={
            "email": "unknown.doctor@hospital.org",
            "password": "Sahayika@123"
        })
        assert unknown_res.status_code == 401
        assert "access_token" not in unknown_res.json()

        # 6. Uppercase email normalization works
        upper_res = await ac.post("/api/v1/auth/login-credentials", json={
            "email": "  ASHA.DEMO@SAHAYIKA.TEST  ",
            "password": "Sahayika@123"
        })
        assert upper_res.status_code == 200
        assert upper_res.json()["user"]["name"] == "Sunita Devi"

        # 7. Firebase unavailable in production mode fails safely with 503
        with patch.object(type(user_repository), "is_connected", new=False), \
             patch("app.services.auth_service.settings.DEMO_MODE", False):
            unavail_res = await ac.post("/api/v1/auth/login-credentials", json={
                "email": "asha.demo@sahayika.test",
                "password": "Sahayika@123"
            })
            assert unavail_res.status_code == 503

@pytest.mark.asyncio
async def test_auth_modes_and_production_enforcement():
    from app.config import settings
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Demo mode allows existing demo fallback
        settings.DEMO_MODE = True
        settings.ENVIRONMENT = "development"
        demo_res = await ac.get("/api/v1/auth/me")
        assert demo_res.status_code == 200
        assert demo_res.json()["name"] == "Sunita Devi"

        # 2. Production mode rejects missing Authorization with 401
        settings.ENVIRONMENT = "production"
        prod_res = await ac.get("/api/v1/auth/me")
        assert prod_res.status_code == 401

        # Production mode rejects explicit demo_token with 401
        prod_demo_res = await ac.get("/api/v1/auth/me", headers={"Authorization": "Bearer demo_token"})
        assert prod_demo_res.status_code == 401

        # 3. Invalid tokens remain rejected in both production and development
        invalid_res_prod = await ac.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid_gibberish_token"})
        assert invalid_res_prod.status_code == 401

        settings.ENVIRONMENT = "development"
        invalid_res_dev = await ac.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid_gibberish_token"})
        assert invalid_res_dev.status_code == 401

        # Restore defaults
        settings.DEMO_MODE = True
        settings.ENVIRONMENT = "development"

@pytest.mark.asyncio
async def test_role_based_signup():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Successful ASHA registration
        asha_email = "test.asha.worker@sahayika.test"
        asha_res = await ac.post("/api/v1/auth/register", json={
            "role": "ASHA",
            "name": "Pooja Devi",
            "email": asha_email,
            "phone": "9876512345",
            "password": "StrongPassword123!",
            "village_name": "Rampur Kalan",
            "district": "Varanasi",
            "state": "Uttar Pradesh",
            "asha_id": "ASHA-UP-VNS-2026-999"
        })
        assert asha_res.status_code == 201
        asha_data = asha_res.json()
        assert "access_token" in asha_data
        assert asha_data["user"]["role"] == "ASHA"
        assert asha_data["user"]["name"] == "Pooja Devi"
        # Password hash must NEVER be exposed
        assert "password_hash" not in asha_data["user"]
        assert "password" not in asha_data["user"]

        # 2. Verify password is bcrypt-hashed in Firestore
        firestore_user = user_repository.get_by_email(asha_email)
        assert firestore_user is not None
        assert "password_hash" in firestore_user
        assert firestore_user["password_hash"].startswith("$2b$")
        from app.core.security import verify_password
        assert verify_password("StrongPassword123!", firestore_user["password_hash"]) is True

        # 3. Successful login immediately after registration
        login_res = await ac.post("/api/v1/auth/login-credentials", json={
            "email": asha_email,
            "password": "StrongPassword123!"
        })
        assert login_res.status_code == 200
        assert login_res.json()["user"]["name"] == "Pooja Devi"

        # 4. Duplicate email rejection (HTTP 409)
        dup_res = await ac.post("/api/v1/auth/register", json={
            "role": "ASHA",
            "name": "Duplicate User",
            "email": asha_email,
            "phone": "9876599999",
            "password": "StrongPassword123!",
            "village_name": "Rampur Kalan"
        })
        assert dup_res.status_code == 409

        # 5. Invalid email rejection (HTTP 422)
        invalid_email_res = await ac.post("/api/v1/auth/register", json={
            "role": "ASHA",
            "name": "Invalid Email",
            "email": "not-an-email",
            "phone": "9876512345",
            "password": "StrongPassword123!",
            "village_name": "Rampur Kalan"
        })
        assert invalid_email_res.status_code == 422

        # 6. Password too short (< 8 chars) rejection (HTTP 422)
        short_pwd_res = await ac.post("/api/v1/auth/register", json={
            "role": "ASHA",
            "name": "Short Password",
            "email": "short.pwd@sahayika.test",
            "phone": "9876512345",
            "password": "short",
            "village_name": "Rampur Kalan"
        })
        assert short_pwd_res.status_code == 422

        # 7. Successful Community registration
        comm_email = "test.community.member@sahayika.test"
        comm_res = await ac.post("/api/v1/auth/register", json={
            "role": "COMMUNITY",
            "name": "Ramesh Kumar",
            "email": comm_email,
            "phone": "9876554321",
            "password": "CommunityPass123!",
            "village_name": "Rampur Kalan",
            "district": "Varanasi",
            "state": "Uttar Pradesh",
            "household_code": "HH-RK-999"
        })
        assert comm_res.status_code == 201
        comm_data = comm_res.json()
        assert "access_token" in comm_data
        assert comm_data["user"]["role"] == "COMMUNITY"
        assert comm_data["user"]["name"] == "Ramesh Kumar"
        assert "password_hash" not in comm_data["user"]

        # 8. Immediate login with newly registered Community member
        comm_login = await ac.post("/api/v1/auth/login-credentials", json={
            "email": comm_email,
            "password": "CommunityPass123!"
        })
        assert comm_login.status_code == 200
        assert comm_login.json()["user"]["role"] == "COMMUNITY"

        # Cleanup test accounts in Firestore
        coll = user_repository._firestore._get_collection()
        if coll:
            from google.cloud.firestore_v1 import FieldFilter
            for em in [asha_email, comm_email]:
                for doc in coll.where(filter=FieldFilter("email", "==", em)).stream():
                    doc.reference.delete()

@pytest.mark.asyncio
async def test_token_revocation_security_and_hashing():
    """
    Phase 1 Verification:
    - Token creation and expiration
    - Revoked token rejection
    - Storage of ONLY SHA-256 hashes (never raw JWTs)
    - Logout endpoint invalidation
    """
    import json
    import os
    from datetime import timedelta
    from app.core.security import create_access_token, verify_token, revoke_token, is_token_revoked, _is_sha256, REVOCATION_FILE, REVOKED_TOKENS

    # 1. Token Creation & Validation
    token = create_access_token(subject="user_test_revocation", role="ASHA")
    assert verify_token(token) == "user_test_revocation"
    assert is_token_revoked(token) is False

    # 2. Expired Token Rejection
    expired_token = create_access_token(subject="user_expired", role="ASHA", expires_delta=timedelta(seconds=-10))
    assert verify_token(expired_token) is None

    # 3. Explicit Revocation & Hashing
    revoke_token(token)
    assert is_token_revoked(token) is True
    assert verify_token(token) is None

    # 4. Storage Security: Ensure raw token is NOT in memory set or persisted file
    assert token not in REVOKED_TOKENS
    if os.path.exists(REVOCATION_FILE):
        with open(REVOCATION_FILE, "r", encoding="utf-8") as f:
            persisted_entries = json.load(f)
            assert isinstance(persisted_entries, list)
            # Verify no entry is a raw JWT (i.e. all must be 64-char SHA256 hex strings)
            assert token not in persisted_entries
            for entry in persisted_entries:
                assert _is_sha256(entry), f"Found non-SHA256 entry in revocation store: {entry[:10]}..."

    # 5. Logout endpoint invalidation
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        new_token = create_access_token(subject="asha_sunita_001", role="ASHA")
        # Me before logout
        me_res = await ac.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_token}"})
        assert me_res.status_code == 200

        # Call logout
        logout_res = await ac.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {new_token}"})
        assert logout_res.status_code == 200

        # Me after logout must be rejected with 401
        me_after = await ac.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_token}"})
        assert me_after.status_code == 401



