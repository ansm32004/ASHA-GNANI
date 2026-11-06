import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.integrations.firebase.firebase_admin import firebase_manager
from app.integrations.firebase.firestore_repository import FirestoreRepository
from app.repositories.household_repository import HouseholdRepository
from app.repositories.visit_repository import VisitRepository
from app.repositories.task_repository import TaskRepository
from app.core.security import create_access_token

client = TestClient(app)

# Ensure initialized
firebase_manager.initialize()
pytestmark = pytest.mark.skipif(
    not firebase_manager.is_connected,
    reason="Requires live Firebase credentials (FIREBASE_CREDENTIALS_PATH)"
)

def test_firebase_manager_connected():
    firebase_manager.initialize()
    assert firebase_manager.is_connected is True
    assert firebase_manager.get_firestore() is not None

def test_firestore_crud_and_persistence():
    repo = FirestoreRepository("households")
    assert repo.is_connected is True

    test_doc_id = "test_hh_audit_999"
    test_data = {
        "id": test_doc_id,
        "household_id": "HH-TEST-999",
        "primary_contact_name": "Test Beneficiary Audit",
        "village": "Rampur Kalan",
        "contact_number": "9876543210",
        "priority": "Urgent",
        "assigned_asha_id": "asha_sunita_001",
        "members": [{"name": "Test Child", "relationship": "Child", "gender": "Male"}]
    }

    # 1. Create in Firestore
    repo.set(test_doc_id, test_data)

    # 2. Fetch directly from Firestore
    fetched = repo.get(test_doc_id)
    assert fetched is not None
    assert fetched["primary_contact_name"] == "Test Beneficiary Audit"
    assert fetched["household_id"] == "HH-TEST-999"

    # 3. Simulate backend restart: create new HouseholdRepository and verify persistence
    fresh_hh_repo = HouseholdRepository()
    record = fresh_hh_repo.get_by_id(test_doc_id)
    assert record is not None
    assert record["primary_contact_name"] == "Test Beneficiary Audit"

    # 4. Update
    fresh_hh_repo.update(test_doc_id, {"primary_contact_name": "Updated Beneficiary Audit"})
    updated_record = repo.get(test_doc_id)
    assert updated_record["primary_contact_name"] == "Updated Beneficiary Audit"

    # 5. Delete and verify cleanup
    deleted = fresh_hh_repo.delete(test_doc_id)
    assert deleted is True
    assert repo.get(test_doc_id) is None

def test_api_household_creation_and_retrieval_via_fastapi():
    # Authenticate as ASHA
    token = create_access_token(subject="asha_sunita_001")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "primary_contact_name": "Geeta Sharma",
        "village": "Rampur Kalan",
        "contact_number": "9811223344",
        "members": []
    }

    response = client.post("/api/v1/households", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    created_hh = response.json()
    created_id = created_hh["id"]
    assert created_hh["primary_contact_name"] == "Geeta Sharma"

    # Fetch via API
    get_res = client.get(f"/api/v1/households/{created_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["primary_contact_name"] == "Geeta Sharma"

    # Verify directly in Firestore
    repo = FirestoreRepository("households")
    doc = repo.get(created_id)
    assert doc is not None
    assert doc["primary_contact_name"] == "Geeta Sharma"

    # Clean up test doc
    repo.delete(created_id)

def test_community_role_isolation():
    # Login as community user
    comm_token = create_access_token(subject="comm_rajesh_001")
    comm_headers = {"Authorization": f"Bearer {comm_token}"}

    # Community user should only see their own household
    res = client.get("/api/v1/households", headers=comm_headers)
    assert res.status_code == 200
    households = res.json()
    assert len(households) == 1
    assert households[0]["id"] == "hh_001" or households[0]["household_id"] == "hh_001"

    # Community user cannot register new households
    create_res = client.post("/api/v1/households", json={
        "primary_contact_name": "Unauthorized Household",
        "village": "Rampur Kalan",
        "contact_number": "9000000000",
        "members": []
    }, headers=comm_headers)
    assert create_res.status_code == 403

    # Community user cannot delete households
    del_res = client.delete("/api/v1/households/hh_001", headers=comm_headers)
    assert del_res.status_code == 403
