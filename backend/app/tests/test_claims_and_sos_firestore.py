import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.integrations.firebase.firebase_admin import firebase_manager
from app.integrations.firebase.firestore_repository import FirestoreRepository
from app.repositories.claim_repository import ClaimRepository, claim_repo
from app.repositories.sos_repository import SosRepository, sos_repo
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture(autouse=True)
def ensure_firebase():
    firebase_manager.initialize()

def test_claims_firestore_crud_and_persistence():
    """
    Verifies that claims persist into Cloud Firestore, survive repository re-instantiation,
    and update properly.
    """
    repo = FirestoreRepository("claims")
    test_claim_id = "test_claim_audit_persist_999"
    test_claim_data = {
        "id": test_claim_id,
        "month": "December",
        "year": 2026,
        "asha_id": "asha_sunita_001",
        "asha_name": "Sunita Devi",
        "activities_count": 2,
        "activities": [
            {
                "id": "act_test_01",
                "activity_date": "2026-12-01",
                "category": "Maternal health",
                "description": "Antenatal checkup test",
                "estimated_amount": 300,
                "status": "Verified"
            }
        ],
        "total_estimated_amount": 300,
        "status": "Draft",
        "submitted_at": None,
        "payment_status": "Pending",
        "supervisor_notes": "Test draft"
    }

    try:
        # 1. Direct write to Firestore claims collection
        repo.set(test_claim_id, test_claim_data)

        # 2. Verify direct read from Firestore
        fetched = repo.get(test_claim_id)
        assert fetched is not None
        assert fetched["month"] == "December"
        assert fetched["total_estimated_amount"] == 300

        # 3. Simulate backend restart: new ClaimRepository instance must load from Firestore
        fresh_claim_repo = ClaimRepository()
        loaded = fresh_claim_repo.get_by_id(test_claim_id)
        assert loaded is not None
        assert loaded["id"] == test_claim_id
        assert loaded["status"] == "Draft"

        # 4. Submit claim and verify Firestore update
        submitted = fresh_claim_repo.submit_claim(test_claim_id)
        assert submitted is not None
        assert submitted["status"] == "Submitted for Review"
        assert submitted["payment_status"] == "Under Verification"

        # Verify update persisted in Firestore
        updated_firestore = repo.get(test_claim_id)
        assert updated_firestore["status"] == "Submitted for Review"

        # 5. Test missing claim handling
        missing = fresh_claim_repo.get_by_id("non_existent_claim_id_xyz")
        assert missing is None

    finally:
        # Clean up test document
        if repo.is_connected:
            repo.delete(test_claim_id)

def test_claims_api_flow_and_persistence():
    """
    Verifies the end-to-end FastAPI endpoint flow for claims.
    """
    token = create_access_token(subject="asha_sunita_001")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List claims
    res = client.get("/api/v1/claims", headers=headers)
    assert res.status_code == 200
    claims = res.json()
    assert isinstance(claims, list)
    assert len(claims) >= 1

    # 2. Get specific claim
    first_id = claims[0]["id"]
    detail_res = client.get(f"/api/v1/claims/{first_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == first_id

    # 3. Non-existent claim returns 404
    missing_res = client.get("/api/v1/claims/non_existent_claim_999", headers=headers)
    assert missing_res.status_code == 404

def test_claims_firestore_failure_handling():
    """
    Verifies that Firestore errors during claim writes are raised safely and not silently hidden.
    """
    test_repo = ClaimRepository()
    test_repo._initialized_db = True
    test_repo._claims = []
    with patch.object(test_repo._firestore, "create_doc", side_effect=RuntimeError("Firestore connection timeout")):
        with pytest.raises(RuntimeError) as exc_info:
            test_repo.prepare_claim(month="NonExistentTestMonth", year=2099)
        assert "Firestore connection timeout" in str(exc_info.value)

def test_sos_firestore_crud_and_persistence():
    """
    Verifies that SOS events persist into Cloud Firestore, survive repository re-instantiation,
    and support acknowledge and escalation workflows.
    """
    repo = FirestoreRepository("sos_events")
    test_sos_id = "test_sos_audit_persist_999"
    test_sos_data = {
        "id": test_sos_id,
        "household_id": "hh_001",
        "household_name": "Meena Devi",
        "beneficiary_name": "Meena Devi",
        "emergency_type": "Immediate Emergency",
        "description": "Simulation: Severe pregnancy distress audit test",
        "status": "Triggered",
        "call_112_initiated": True,
        "asha_notified": True,
        "escalation_level": 3,
        "timestamp": "2026-11-06T00:00:00Z",
        "resolved_at": None,
        "notes": "Emergency alert initiated."
    }

    try:
        # 1. Direct write to Firestore sos_events collection
        repo.set(test_sos_id, test_sos_data)

        # 2. Verify direct read from Firestore
        fetched = repo.get(test_sos_id)
        assert fetched is not None
        assert fetched["emergency_type"] == "Immediate Emergency"
        assert fetched["escalation_level"] == 3

        # 3. Simulate backend restart: new SosRepository instance must load from Firestore
        fresh_sos_repo = SosRepository()
        loaded = fresh_sos_repo.get_by_id(test_sos_id)
        assert loaded is not None
        assert loaded["id"] == test_sos_id
        assert loaded["status"] == "Triggered"

        # 4. Acknowledge SOS event and verify persistence
        acknowledged = fresh_sos_repo.acknowledge(test_sos_id, notes="Nurse on the way")
        assert acknowledged is not None
        assert acknowledged["status"] == "Acknowledged"
        assert "Nurse on the way" in acknowledged["notes"]

        updated_firestore = repo.get(test_sos_id)
        assert updated_firestore["status"] == "Acknowledged"

        # 5. Escalate SOS event
        escalated = fresh_sos_repo.escalate(test_sos_id, notes="Ambulance dispatched")
        assert escalated is not None
        assert escalated["status"] == "Escalated"
        assert escalated["escalation_level"] == 3

        # 6. Test missing SOS event handling
        missing = fresh_sos_repo.get_by_id("non_existent_sos_999")
        assert missing is None

    finally:
        # Clean up test document
        if repo.is_connected:
            repo.delete(test_sos_id)

def test_sos_api_flow_and_preservation():
    """
    Verifies that the SOS API endpoints, schemas, response formats, and status codes
    are 100% preserved.
    """
    token = create_access_token(subject="asha_sunita_001")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List SOS events
    res = client.get("/api/v1/sos", headers=headers)
    assert res.status_code == 200
    events = res.json()
    assert isinstance(events, list)
    assert len(events) >= 1

    # 2. Trigger SOS via API
    payload = {
        "household_id": "hh_001",
        "beneficiary_name": "Meena Devi",
        "emergency_type": "Immediate Emergency",
        "description": "API trigger test for SOS audit",
        "location": "Ward 3",
        "consent_obtained": True
    }
    trigger_res = client.post("/api/v1/sos", json=payload, headers=headers)
    assert trigger_res.status_code == 201
    created_event = trigger_res.json()
    created_id = created_event["id"]
    assert created_event["description"] == "API trigger test for SOS audit"
    assert created_event["status"] == "Triggered"

    # 3. Get SOS details
    detail_res = client.get(f"/api/v1/sos/{created_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == created_id

    # 4. Acknowledge SOS via API
    ack_res = client.post(f"/api/v1/sos/{created_id}/acknowledge", json={"notes": "ASHA notified"}, headers=headers)
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "Acknowledged"

    # 5. Escalate SOS via API
    esc_res = client.post(f"/api/v1/sos/{created_id}/escalate", json={"notes": "Call 112"}, headers=headers)
    assert esc_res.status_code == 200
    assert esc_res.json()["status"] == "Escalated"

    # Clean up created event from Firestore
    repo = FirestoreRepository("sos_events")
    if repo.is_connected:
        repo.delete(created_id)

def test_sos_firestore_failure_handling():
    """
    Verifies that SOS creation fails safely and loudly if Firestore is down.
    SOS must NEVER silently report success if the database write failed.
    """
    test_repo = SosRepository()
    with patch.object(test_repo._firestore, "create_doc", side_effect=RuntimeError("Firestore write failed")):
        with pytest.raises(RuntimeError) as exc_info:
            test_repo.create({
                "household_id": "hh_001",
                "description": "Critical SOS event",
                "emergency_type": "Immediate Emergency"
            })
        assert "Firestore write failed" in str(exc_info.value)

def test_sos_collision_handling_and_retry():
    """
    Verifies that SOS ID generation never collides with existing IDs (e.g. sos_001 and sos_003),
    and correctly retries if an AlreadyExists exception is encountered from Firestore.
    """
    from google.api_core.exceptions import AlreadyExists

    test_repo = SosRepository()
    test_repo._initialized_db = True
    # Force existing events to simulate a gap (sos_001 and sos_003 exist, length = 2)
    test_repo._events = [
        {"id": "sos_003", "status": "Triggered", "timestamp": "2026-11-06T00:00:00Z"},
        {"id": "sos_001", "status": "Resolved", "timestamp": "2026-10-14T00:00:00Z"}
    ]

    # Mock Firestore create_doc: simulate that 'sos_004' already exists, forcing retry to 'sos_005'
    call_ids = []
    def mock_create_doc(doc_id, data):
        call_ids.append(doc_id)
        if doc_id == "sos_004":
            raise AlreadyExists("Document already exists in Firestore")
        return True

    with patch.object(test_repo._firestore, "create_doc", side_effect=mock_create_doc):
        created = test_repo.create({
            "household_id": "hh_001",
            "description": "Test collision retry",
            "emergency_type": "Immediate Emergency"
        })
        # Verify it tried sos_004, encountered collision, and successfully created sos_005
        assert "sos_004" in call_ids
        assert created["id"] == "sos_005"
        assert test_repo._events[0]["id"] == "sos_005"

def test_sos_cache_consistency_on_failed_write():
    """
    Verifies that if Firestore set fails during acknowledge or escalate,
    the in-memory cache is NOT corrupted and retains its original status.
    """
    test_repo = SosRepository()
    test_repo._initialized_db = True
    test_repo._events = [
        {"id": "sos_test_consistency", "status": "Triggered", "notes": "Initial alert", "escalation_level": 1}
    ]

    with patch.object(test_repo._firestore, "set", side_effect=RuntimeError("Firestore connection dropped")):
        # 1. Acknowledge fails
        with pytest.raises(RuntimeError):
            test_repo.acknowledge("sos_test_consistency", notes="Attempted ack")

        # Verify in-memory record remains Triggered, notes uncorrupted
        record = test_repo.get_by_id("sos_test_consistency")
        assert record["status"] == "Triggered"
        assert record["notes"] == "Initial alert"

        # 2. Escalate fails
        with pytest.raises(RuntimeError):
            test_repo.escalate("sos_test_consistency", notes="Attempted esc")

        # Verify in-memory record remains Triggered, escalation_level remains 1
        record = test_repo.get_by_id("sos_test_consistency")
        assert record["status"] == "Triggered"
        assert record["escalation_level"] == 1
        assert record["notes"] == "Initial alert"

def test_claims_cache_consistency_on_failed_write():
    """
    Verifies that if Firestore set fails during submit_claim,
    the in-memory claim retains its Draft status and is not mutated.
    """
    test_repo = ClaimRepository()
    test_repo._initialized_db = True
    test_repo._claims = [
        {
            "id": "claim_test_consistency",
            "status": "Draft",
            "month": "October",
            "year": 2026,
            "payment_status": "Pending"
        }
    ]

    with patch.object(test_repo._firestore, "set", side_effect=RuntimeError("Firestore timeout")):
        with pytest.raises(RuntimeError):
            test_repo.submit_claim("claim_test_consistency")

        # Verify in-memory record was NOT mutated
        claim = test_repo.get_by_id("claim_test_consistency")
        assert claim["status"] == "Draft"
        assert claim["payment_status"] == "Pending"

def test_claims_collision_handling_concurrent():
    """
    Verifies that if a concurrent process creates a claim for the same month/year
    causing AlreadyExists, prepare_claim safely returns the existing claim without crashing.
    """
    from google.api_core.exceptions import AlreadyExists

    test_repo = ClaimRepository()
    test_repo._initialized_db = True
    existing_claim = {
        "id": "claim_2026_march",
        "month": "March",
        "year": 2026,
        "status": "Draft",
        "total_estimated_amount": 500
    }
    test_repo._claims = [existing_claim]

    with patch.object(test_repo._firestore, "create_doc", side_effect=AlreadyExists("Document exists")):
        result = test_repo.prepare_claim(month="March", year=2026)
        assert result["id"] == "claim_2026_march"
        assert result["status"] == "Draft"

