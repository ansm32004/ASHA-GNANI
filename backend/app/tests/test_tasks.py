import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_task_operations():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. List tasks
        res = await ac.get("/api/v1/tasks")
        assert res.status_code == 200
        tasks = res.json()
        assert len(tasks) > 0

        # 2. Complete task
        task_id = tasks[0]["id"]
        comp_res = await ac.post(f"/api/v1/tasks/{task_id}/complete", json={"notes": "Completed successfully during field visit"})
        assert comp_res.status_code == 200
        assert comp_res.json()["status"] == "Completed"

        # 3. Reschedule another task
        if len(tasks) > 1:
            task_2_id = tasks[1]["id"]
            resched_res = await ac.post(f"/api/v1/tasks/{task_2_id}/reschedule", json={
                "new_due_date": "2026-11-10",
                "notes": "Family requested post-festival visit"
            })
            assert resched_res.status_code == 200
            assert resched_res.json()["due_date"] == "2026-11-10"

        # 4. Fetch task detail by ID
        detail_res = await ac.get(f"/api/v1/tasks/{task_id}")
        assert detail_res.status_code == 200
        detail_data = detail_res.json()
        assert detail_data["id"] == task_id
        assert detail_data["status"] == "Completed"
        assert "description" in detail_data
        assert "task_type" in detail_data

        # 5. Fetch non-existent task returns 404
        nf_res = await ac.get("/api/v1/tasks/task_non_existent_999999")
        assert nf_res.status_code == 404

@pytest.mark.asyncio
async def test_reschedule_task_sends_notification_to_person():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Fetch available tasks
        res = await ac.get("/api/v1/tasks")
        assert res.status_code == 200
        tasks = res.json()
        assert len(tasks) > 0
        target_task = tasks[0]
        task_id = target_task["id"]
        hh_id = target_task.get("household_id") or "hh_001"
        target_user = "comm_meena_001" if hh_id == "hh_001" else hh_id

        # 2. Reschedule the task
        resched_res = await ac.post(f"/api/v1/tasks/{task_id}/reschedule", json={
            "new_due_date": "2026-11-25",
            "notes": "Rescheduled for post-natal checkup at convenient time"
        })
        assert resched_res.status_code == 200
        assert resched_res.json()["due_date"] == "2026-11-25"

        # 3. Verify notification was dispatched to the beneficiary / household
        notif_res = await ac.get(f"/api/v1/notifications?user_id={target_user}")
        assert notif_res.status_code == 200
        notifs = notif_res.json()
        matching = [
            n for n in notifs
            if n.get("action_id") == task_id and n.get("title") == "Visit Rescheduled"
        ]
        assert len(matching) > 0, f"Expected reschedule notification for {target_user}, found {notifs}"
        resched_notif = matching[0]
        assert "2026-11-25" in resched_notif["message"]
        assert resched_notif["category"] == "Follow-up due"


@pytest.mark.asyncio
async def test_claims_simulation():
    from app.repositories.claim_repository import claim_repo
    claim_id = "claim_2026_november_2026"
    claim_repo.delete(claim_id)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        try:
            # 1. Prepare draft claim for November 2026
            prep_res = await ac.post("/api/v1/claims/prepare", json={"month": "November 2026"})
            assert prep_res.status_code == 200
            claim = prep_res.json()
            assert claim["status"] == "Draft"
            assert claim["total_estimated_amount"] > 0
            claim_id = claim["id"]

            # 2. Submit claim to simulated supervisor
            sub_res = await ac.post(f"/api/v1/claims/{claim_id}/submit")
            assert sub_res.status_code == 200
            assert sub_res.json()["status"] == "Submitted for Review"
        finally:
            claim_repo.delete(claim_id)

@pytest.mark.asyncio
async def test_sos_simulation():
    from app.repositories.sos_repository import sos_repo
    created_id = None
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        try:
            # Trigger safe simulated emergency alert
            sos_res = await ac.post("/api/v1/sos", json={
                "household_id": "hh_001",
                "emergency_type": "Immediate Emergency",
                "description": "Simulation test: High fever and severe dehydration in infant",
                "consent_given": True
            })
            assert sos_res.status_code == 201
            event = sos_res.json()
            created_id = event["id"]
            assert event["call_112_initiated"] is True
            assert event["status"] == "Triggered"

            # Acknowledge
            ack_res = await ac.post(f"/api/v1/sos/{event['id']}/acknowledge", json={"notes": "ASHA on way with ORS"})
            assert ack_res.status_code == 200
            assert ack_res.json()["status"] == "Acknowledged"
        finally:
            if created_id and sos_repo._firestore.is_connected:
                sos_repo._firestore.delete(created_id)
                sos_repo._events = [e for e in sos_repo._events if e.get("id") != created_id]

