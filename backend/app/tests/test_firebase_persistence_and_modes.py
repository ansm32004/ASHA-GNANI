import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.integrations.firebase.firebase_admin import firebase_manager
from app.repositories.household_repository import HouseholdRepository
from app.repositories.visit_repository import VisitRepository
from app.repositories.task_repository import TaskRepository
from app.repositories.request_repository import RequestRepository
from app.repositories.claim_repository import ClaimRepository
from app.repositories.sos_repository import SosRepository
from app.repositories.ai_conversation_repository import ai_conversation_repo
from app.core.security import create_access_token

client = TestClient(app)

def test_health_check_dynamic_fields():
    """Verify health endpoint dynamically reflects connection and storage mode."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "firebase_connected" in data
    assert "storage_mode" in data
    assert "demo_mode" in data
    assert data["storage_mode"] in ["firestore", "memory"]

def test_collision_resistant_id_generation():
    """Verify generated IDs across repositories are collision-resistant and unique."""
    hh_repo = HouseholdRepository()
    vis_repo = VisitRepository()
    task_repo = TaskRepository()
    req_repo = RequestRepository()

    generated_ids = set()

    for i in range(25):
        hh = hh_repo.create({
            "primary_contact_name": f"Family {i}",
            "contact_number": "9876543210",
            "village": "Rampur Kalan"
        })
        vis = vis_repo.create({
            "household_id": hh["id"],
            "activity_description": f"Checkup {i}"
        })
        tsk = task_repo.create({
            "household_id": hh["id"],
            "description": f"Follow-up {i}",
            "due_date": "2026-11-20"
        })
        req = req_repo.create({
            "household_id": hh["id"],
            "category": "Medicine",
            "description": f"Need ORS {i}"
        })

        assert hh["id"] not in generated_ids
        generated_ids.add(hh["id"])

        assert vis["id"] not in generated_ids
        generated_ids.add(vis["id"])

        assert tsk["id"] not in generated_ids
        generated_ids.add(tsk["id"])

        assert req["id"] not in generated_ids
        generated_ids.add(req["id"])

    assert len(generated_ids) == 100

def test_live_mode_error_handling_when_disconnected():
    """
    Verifies that when DEMO_MODE is False (Live Mode) and Firebase is disconnected,
    repositories reject writes loudly rather than pretending success with in-memory data.
    """
    hh_repo = HouseholdRepository()
    vis_repo = VisitRepository()
    task_repo = TaskRepository()
    req_repo = RequestRepository()
    claim_repo = ClaimRepository()

    from unittest.mock import PropertyMock
    with patch.object(settings, "DEMO_MODE", False):
        with patch.object(type(firebase_manager), "is_connected", new_callable=PropertyMock, return_value=False):
            # Household create must raise in live mode without Firestore
            with pytest.raises(RuntimeError) as exc_info:
                hh_repo.create({
                    "primary_contact_name": "Live Test Failure",
                    "contact_number": "9876543210"
                })
            assert "Cloud Firestore is disconnected" in str(exc_info.value)

            # Visit create must raise
            with pytest.raises(RuntimeError):
                vis_repo.create({
                    "household_id": "hh_001",
                    "activity_description": "Live Visit Failure"
                })

            # Task create must raise
            with pytest.raises(RuntimeError):
                task_repo.create({
                    "household_id": "hh_001",
                    "description": "Live Task Failure",
                    "due_date": "2026-11-30"
                })

            # Request create must raise
            with pytest.raises(RuntimeError):
                req_repo.create({
                    "household_id": "hh_001",
                    "category": "Ambulance",
                    "description": "Live Request Failure"
                })

            # Claim prepare must raise
            with pytest.raises(RuntimeError):
                claim_repo.prepare_claim(month="December", year=2026)

def test_community_role_authorization_block_on_claims():
    """Verify community role cannot read or submit ASHA claims."""
    community_token = create_access_token(subject="comm_meena_001")
    headers = {"Authorization": f"Bearer {community_token}"}

    # Attempt to list claims
    res = client.get("/api/v1/claims", headers=headers)
    assert res.status_code == 403

    # Attempt to prepare claim
    res = client.post("/api/v1/claims/prepare", json={"month": "November", "year": 2026}, headers=headers)
    assert res.status_code == 403

def test_community_role_authorization_block_on_visit_confirmation():
    """Verify community role cannot confirm or record ASHA field visits."""
    community_token = create_access_token(subject="comm_meena_001")
    headers = {"Authorization": f"Bearer {community_token}"}

    payload = {
        "household_id": "hh_001",
        "visit_date": "2026-11-06",
        "activity_category": "Maternal Health",
        "activity_description": "Unauthorized attempt",
        "visit_outcome": "Normal"
    }
    res = client.post("/api/v1/visits/confirm", json=payload, headers=headers)
    assert res.status_code == 403

def test_community_role_data_isolation_on_visits():
    """Verify community users only see visits belonging to their household."""
    community_token = create_access_token(subject="comm_meena_001")
    headers = {"Authorization": f"Bearer {community_token}"}

    res = client.get("/api/v1/visits", headers=headers)
    assert res.status_code == 200
    visits = res.json()
    for v in visits:
        assert v["household_id"] == "hh_001"

def test_ai_conversation_logging():
    """Verify AI interactions are logged with metadata and safety level."""
    interaction = ai_conversation_repo.log_interaction(
        query="गर्भावस्था में चक्कर आ रहे हैं",
        response_text="तुरंत आराम करें और पीएचसी डॉक्टर को दिखाएं",
        user_id="comm_meena_001",
        household_id="hh_001",
        language="hi",
        safety_level="Level 2 Triggered"
    )
    assert interaction["id"].startswith("conv_")
    assert interaction["user_id"] == "comm_meena_001"
    assert interaction["safety_level"] == "Level 2 Triggered"

    history = ai_conversation_repo.list_user_conversations("comm_meena_001")
    assert len(history) >= 1
    assert any(h["id"] == interaction["id"] for h in history)
