import pytest
from datetime import date
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_community_request_visit_syncs_asha_notification_and_schedule():
    """
    End-to-end verification:
    When a community member submits a visit request:
    1. An unread notification must immediately appear in their respective ASHA worker's notifications.
    2. A corresponding follow-up task must immediately appear in their respective ASHA worker's schedule for today.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Step 1: Login as Community Member (Meena Devi)
        comm_login = await ac.post("/api/v1/auth/login-credentials", json={
            "email": "community.demo@sahayika.test",
            "password": "Sahayika@123"
        })
        assert comm_login.status_code == 200, f"Community login failed: {comm_login.text}"
        comm_token = comm_login.json()["access_token"]
        comm_headers = {"Authorization": f"Bearer {comm_token}"}

        # Step 2: Community member submits a visit request with a preferred date
        visit_desc = "Need BP monitoring and iron supplements refill for 3rd trimester"
        preferred_call_date = "10-11-2026"
        request_payload = {
            "household_id": "hh_001",
            "beneficiary_name": "Meena Devi",
            "category": "Household visit request",
            "description": visit_desc,
            "priority": "Urgent",
            "preferred_date": preferred_call_date
        }
        req_res = await ac.post("/api/v1/requests", json=request_payload, headers=comm_headers)
        assert req_res.status_code == 201, f"Create request failed: {req_res.text}"
        req_data = req_res.json()
        req_id = req_data["id"]
        assert req_data["category"] == "Household visit request"
        assert req_data["description"] == visit_desc
        assert req_data.get("preferred_date") == preferred_call_date

        # Step 3: Login as ASHA Worker (Sunita Devi)
        asha_login = await ac.post("/api/v1/auth/login-credentials", json={
            "email": "asha.demo@sahayika.test",
            "password": "Sahayika@123"
        })
        assert asha_login.status_code == 200, f"ASHA login failed: {asha_login.text}"
        asha_token = asha_login.json()["access_token"]
        asha_headers = {"Authorization": f"Bearer {asha_token}"}

        # Step 4: Verify Notification appeared on ASHA worker's notifications as the FIRST card
        notifs_res = await ac.get("/api/v1/notifications", headers=asha_headers)
        assert notifs_res.status_code == 200, f"Fetch notifications failed: {notifs_res.text}"
        notifs = notifs_res.json()
        assert len(notifs) > 0, "ASHA worker notifications list should not be empty"

        # The new visit request notification must appear FIRST (at index 0)
        first_notif = notifs[0]
        assert first_notif.get("action_id") == req_id or visit_desc in first_notif.get("message", ""), \
            f"Newest community visit request notification should be at the very top (index 0), found: {first_notif}"
        assert first_notif["is_read"] is False, "New visit request notification should be unread"
        assert "Visit Request" in first_notif["title"]
        assert "Meena Devi" in first_notif["message"]
        assert f"Preferred Date/Call: {preferred_call_date}" in first_notif["message"]

        # Step 5: Verify Task was scheduled in ASHA worker's schedule with preferred date
        tasks_res = await ac.get("/api/v1/tasks", headers=asha_headers)
        assert tasks_res.status_code == 200, f"Fetch tasks failed: {tasks_res.text}"
        tasks = tasks_res.json()

        matching_task = next((t for t in tasks if t.get("created_from_request_id") == req_id or visit_desc in t.get("description", "")), None)
        assert matching_task is not None, "Task for community visit request was not scheduled in ASHA worker schedule"
        assert matching_task["due_date"] == "2026-11-10", f"Task due_date should match preferred date formatted YYYY-MM-DD, got {matching_task['due_date']}"
        assert matching_task["household_id"] == "hh_001"
        assert matching_task["created_from"] == "Community Request"

        # Step 6: Community member lists requests and sees the request as active (not resolved)
        comm_reqs_active = await ac.get("/api/v1/requests", headers=comm_headers)
        assert comm_reqs_active.status_code == 200
        active_list = [r for r in comm_reqs_active.json() if r.get("id") == req_id]
        assert len(active_list) == 1
        assert active_list[0]["status"] != "Resolved"
        assert active_list[0]["preferred_date"] == preferred_call_date

        # Step 7: ASHA Worker completes the scheduled visit task
        complete_res = await ac.post(
            f"/api/v1/tasks/{matching_task['id']}/complete",
            json={"notes": "Completed 3rd trimester BP and hemoglobin check during home visit"},
            headers=asha_headers
        )
        assert complete_res.status_code == 200
        assert complete_res.json()["status"] == "Completed"

        # Step 8: Verify Community request is automatically marked Resolved upon task completion
        comm_reqs_resolved = await ac.get("/api/v1/requests", headers=comm_headers)
        assert comm_reqs_resolved.status_code == 200
        resolved_req = next((r for r in comm_reqs_resolved.json() if r.get("id") == req_id), None)
        assert resolved_req is not None
        assert resolved_req["status"] == "Resolved"
        assert any("Resolved" in hist for hist in resolved_req.get("response_history", []))

        # Step 9: Verify no active (unresolved) requests remain for Meena Devi's household, allowing new visit requests
        unresolved = [r for r in comm_reqs_resolved.json() if r.get("status") not in ["Resolved", "Completed"]]
        assert len(unresolved) == 0, f"Expected 0 active requests after completion, found: {unresolved}"
