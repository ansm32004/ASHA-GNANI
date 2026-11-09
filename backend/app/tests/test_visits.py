import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_visit_and_auto_task_creation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. AI Extract Visit from spoken transcript
        raw_transcript = "Aaj Meena Devi ke ghar gayi thi. Child vaccination next week. Friday ko dobara jaana hai."
        extract_res = await ac.post("/api/v1/ai/extract-visit", json={
            "transcript": raw_transcript,
            "household_id": "hh_001",
            "language": "hi"
        })
        assert extract_res.status_code == 200
        extracted = extract_res.json()["extracted_fields"]
        assert extracted["beneficiary_name"] == "Meena Devi"
        assert extracted["follow_up_required"] is True

        # 2. Confirm Visit with speech_transcript
        confirm_payload = {
            "household_id": "hh_001",
            "beneficiary_name": "Meena Devi",
            "visit_date": "2026-11-03",
            "activity_category": "Maternal Health",
            "activity_description": "ANC Home visit. Monitored blood pressure, confirmed IFA intake.",
            "speech_transcript": raw_transcript,
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
        assert visit_data["speech_transcript"] == raw_transcript
        assert visit_data["created_task_id"] is not None

        # 3. Check that the auto-generated task exists
        task_id = visit_data["created_task_id"]
        tasks_res = await ac.get("/api/v1/tasks")
        assert tasks_res.status_code == 200
        all_tasks = tasks_res.json()
        matching = [t for t in all_tasks if t["id"] == task_id]
        assert len(matching) == 1
        assert matching[0]["household_id"] == "hh_001"

@pytest.mark.asyncio
async def test_voice_transcription_persistence_and_retrieval():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        spoken_voice_note = "Maine Sunita Devi ka BP check kiya, 120/80 tha, baby healthy hai aur iron tablets de di."
        ai_summary = "PNC Checkup: BP normal (120/80). Infant vitals normal. Distributed 30-day iron supplements."

        # 1. Confirm visit with both verbatim speech transcript and structured summary
        payload = {
            "household_id": "hh_002",
            "beneficiary_name": "Sunita Devi",
            "visit_date": "2026-11-07",
            "activity_category": "Maternal Health",
            "activity_description": ai_summary,
            "speech_transcript": spoken_voice_note,
            "visit_outcome": "Normal",
            "follow_up_required": False,
            "priority": "Routine",
            "notes": "Next immunization scheduled at PHC."
        }

        res = await ac.post("/api/v1/visits/confirm", json=payload)
        assert res.status_code == 201
        data = res.json()
        visit_id = data["id"]

        # Exact original transcript preserved and distinct from AI summary
        assert data["speech_transcript"] == spoken_voice_note
        assert data["activity_description"] == ai_summary
        assert data["speech_transcript"] != data["activity_description"]

        # 2. Fetch specific visit by ID - speech_transcript remains available
        detail_res = await ac.get(f"/api/v1/visits/{visit_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert detail["id"] == visit_id
        assert detail["speech_transcript"] == spoken_voice_note
        assert detail["activity_description"] == ai_summary

        # 3. Fetch visit list - speech_transcript remains available
        list_res = await ac.get("/api/v1/visits?household_id=hh_002")
        assert list_res.status_code == 200
        visits_list = list_res.json()
        matching_visits = [v for v in visits_list if v["id"] == visit_id]
        assert len(matching_visits) == 1
        assert matching_visits[0]["speech_transcript"] == spoken_voice_note

        # 4. Verify manual visit entry flow (without voice recording / speech_transcript = None)
        manual_payload = {
            "household_id": "hh_001",
            "beneficiary_name": "Meena Devi",
            "visit_date": "2026-11-07",
            "activity_category": "General",
            "activity_description": "Manual checkup entry by ASHA worker.",
            "speech_transcript": None,
            "visit_outcome": "Normal",
            "follow_up_required": False,
            "priority": "Routine"
        }
        manual_res = await ac.post("/api/v1/visits/confirm", json=manual_payload)
        assert manual_res.status_code == 201
        manual_data = manual_res.json()
        assert manual_data["speech_transcript"] is None
        assert manual_data["activity_description"] == "Manual checkup entry by ASHA worker."

