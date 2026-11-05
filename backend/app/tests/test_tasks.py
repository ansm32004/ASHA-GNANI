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

