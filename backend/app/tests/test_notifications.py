import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.integrations.firebase.firebase_admin import firebase_manager
from app.integrations.firebase.messaging_service import firebase_messaging
from app.repositories.user_repository import user_repository

@pytest.fixture(autouse=True)
def setup_firebase_and_auth():
    firebase_manager.initialize()
    user_repository._ensure_initialized()

@pytest.mark.asyncio
async def test_device_token_registration_flow():
    """
    Test registering an FCM device token via the API and verifying that it is saved
    and synchronized with Firestore without modifying unrelated user fields.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Step 1: Login with Sunita Devi credentials to get a verified JWT token
        login_res = await ac.post("/api/v1/auth/login-credentials", json={
            "email": "asha.demo@sahayika.test",
            "password": "Sahayika@123"
        })
        assert login_res.status_code == 200
        jwt_token = login_res.json()["access_token"]
        user_id = login_res.json()["user"]["id"]
        headers = {"Authorization": f"Bearer {jwt_token}"}

        # Step 2: Register device token
        test_fcm_token = "fcm_test_token_sunita_device_12345"
        reg_res = await ac.post(
            "/api/v1/notifications/device-token",
            json={"token": test_fcm_token, "platform": "android"},
            headers=headers
        )
        assert reg_res.status_code == 200
        reg_data = reg_res.json()
        assert reg_data["status"] == "success"

        # Step 3: Verify the token is accessible via messaging service
        resolved_token = firebase_messaging.get_token_for_user(user_id)
        assert resolved_token == test_fcm_token

        # Step 4: If Firestore is connected, verify user doc retains original profile fields
        if firebase_manager.is_connected:
            db = firebase_manager.get_firestore()
            user_doc = db.collection("users").document(user_id).get()
            assert user_doc.exists
            user_data = user_doc.to_dict()
            # FCM token synchronized
            assert user_data.get("fcm_token") == test_fcm_token
            assert user_data.get("fcm_platform") == "android"
            # Original profile fields completely preserved (merge=True)
            assert user_data.get("email") == "asha.demo@sahayika.test"
            assert user_data.get("name") == "Sunita Devi"
            assert user_data.get("role") == "ASHA"

        # Step 5: Test authenticated test-push endpoint with registered token
        push_res = await ac.post(
            "/api/v1/notifications/test-push",
            json={
                "title": "Welcome Alert",
                "body": "Test message delivery",
                "data": {"click_action": "OPEN_DASHBOARD"}
            },
            headers=headers
        )
        assert push_res.status_code == 200
        push_data = push_res.json()
        assert push_data["recipient_id"] == user_id
        assert push_data["token_used"] is not None

        # Step 6: Unregister device token (e.g. on user logout)
        unreg_res = await ac.delete("/api/v1/notifications/device-token", headers=headers)
        assert unreg_res.status_code == 200
        assert unreg_res.json()["status"] == "success"

        # Verify token is cleared from memory and user doc
        assert firebase_messaging._tokens.get(user_id) is None
        if firebase_manager.is_connected:
            db = firebase_manager.get_firestore()
            fcm_doc = db.collection("fcm_tokens").document(user_id).get()
            assert not fcm_doc.exists
            # User document exists but fcm_token field is cleared
            u_doc = db.collection("users").document(user_id).get()
            assert u_doc.exists
            assert "fcm_token" not in u_doc.to_dict() or u_doc.to_dict().get("fcm_token") is None

@pytest.mark.asyncio
async def test_test_push_without_token():
    """
    Test that sending test-push to a user with no registered token returns a safe warning.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post("/api/v1/auth/login-credentials", json={
            "email": "community.demo@sahayika.test",
            "password": "Sahayika@123"
        })
        assert login_res.status_code == 200
        jwt_token = login_res.json()["access_token"]
        user_id = login_res.json()["user"]["id"]
        headers = {"Authorization": f"Bearer {jwt_token}"}

        # Ensure no token is stored for this user
        firebase_messaging.unregister_device_token(user_id)

        push_res = await ac.post("/api/v1/notifications/test-push", json={}, headers=headers)
        assert push_res.status_code == 200
        data = push_res.json()
        assert data["status"] == "warning"
        assert data["delivered"] is False
        assert data["token_used"] is None

@pytest.mark.asyncio
async def test_multicast_and_token_purge():
    """
    Test multicast push helper and automatic purging of dead/invalid tokens.
    """
    test_token_1 = "fcm_valid_simulated_token_001"
    test_token_2 = "fcm_invalid_simulated_token_002"

    # Register token 2 for mock user
    mock_uid = "test_user_purge_001"
    firebase_messaging.register_device_token(mock_uid, test_token_2, "android")
    assert firebase_messaging.get_token_for_user(mock_uid) == test_token_2

    # Purge invalid token
    firebase_messaging.purge_invalid_token(test_token_2)
    assert firebase_messaging._tokens.get(mock_uid) is None

    # Test multicast dispatch
    result = firebase_messaging.send_multicast(
        tokens=[test_token_1],
        title="Multicast Test",
        body="Broadcast to multiple health workers"
    )
    assert "success_count" in result
    assert "failure_count" in result
    assert "failed_tokens" in result
