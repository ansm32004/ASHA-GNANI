import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_visit_and_auto_task_creation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. AI Extract Visit from spoken transcript
        extract_res = await ac.post("/api/v1/ai/extract-visit", json={
            "transcript": "Aaj Meena Devi ke ghar gayi thi. Child vaccination next week. Friday ko dobara jaana hai.",
            "household_id": "hh_001",
            "language": "hi"
        })
        assert extract_res.status_code == 200
        extracted = extract_res.json()["extracted_fields"]
        assert extracted["beneficiary_name"] == "Meena Devi"
        assert extracted["follow_up_required"] is True

        # 2. Confirm Visit
        confirm_payload = {
            "household_id": "hh_001",
            "beneficiary_name": "Meena Devi",
            "visit_date": "2026-11-03",
            "activity_category": "Maternal Health",
            "activity_description": "ANC Home visit. Monitored blood pressure, confirmed IFA intake.",
            "visit_outcome": "Normal",
            "follow_up_required": True,
            "follow_up_date": "2026-11-07",
            "priority": "Priority",
            "notes": "Patient advised regarding birth preparedness."
        }
        confirm_res = await ac.post("/api/v1/visits/confirm", json=confirm_payload)
        assert confirm_res.status_code == 201
        visit_data = confirm_res.json()
        assert visit_data["status"] == "Confirmed"
        assert visit_data["created_task_id"] is not None

        # 3. Check that the auto-generated task exists
        task_id = visit_data["created_task_id"]
        tasks_res = await ac.get("/api/v1/tasks")
        assert tasks_res.status_code == 200
        all_tasks = tasks_res.json()
        matching = [t for t in all_tasks if t["id"] == task_id]
        assert len(matching) == 1
        assert matching[0]["household_id"] == "hh_001"

