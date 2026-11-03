import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

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

        # Step 4: Test ASHA Credentials Login
        asha_cred_res = await ac.post("/api/v1/auth/login-credentials", json={
            "email": "asha.demo@sahayika.test",
            "password": "Sahayika@123"
        })
        assert asha_cred_res.status_code == 200
        assert asha_cred_res.json()["user"]["role"] == "ASHA"

        # Step 5: Test Community Credentials Login
        comm_cred_res = await ac.post("/api/v1/auth/login-credentials", json={
            "email": "community.demo@sahayika.test",
            "password": "Sahayika@123"
        })
        assert comm_cred_res.status_code == 200
        assert comm_cred_res.json()["user"]["role"] == "COMMUNITY"
        assert comm_cred_res.json()["user"]["name"] == "Meena Devi"

