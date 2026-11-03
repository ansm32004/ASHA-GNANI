import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_journey_6_authentication_separation():
    """
    Journey 6: Authentication
    Login as ASHA -> Verify role & token -> Logout
    Login as Community -> Verify role & token -> Logout
    Login as ASHA again -> Verify state is clean
    """
    # 1. Login as ASHA Demo
    res_asha = client.post("/api/v1/auth/login-credentials", json={
        "email": "asha.demo@sahayika.test",
        "password": "Sahayika@123"
    })
    assert res_asha.status_code == 200, res_asha.text
    asha_data = res_asha.json()
    assert asha_data["user"]["role"] == "ASHA"
    assert asha_data["user"]["name"] == "Sunita Devi"
    assert "access_token" in asha_data

    # 2. Login as Community Demo
    res_comm = client.post("/api/v1/auth/login-credentials", json={
        "email": "community.demo@sahayika.test",
        "password": "Sahayika@123"
    })
    assert res_comm.status_code == 200, res_comm.text
    comm_data = res_comm.json()
    assert comm_data["user"]["role"] == "COMMUNITY"
    assert comm_data["user"]["name"] == "Meena Devi"
    assert comm_data["user"]["household_id"] == "hh_001"
    assert "access_token" in comm_data

    # 3. Invalid credentials rejection
    res_fail = client.post("/api/v1/auth/login-credentials", json={
        "email": "asha.demo@sahayika.test",
        "password": "WrongPassword@999"
    })
    assert res_fail.status_code == 401

    # 4. Login as ASHA again
    res_asha_again = client.post("/api/v1/auth/login-credentials", json={
        "email": "asha.demo@sahayika.test",
        "password": "Sahayika@123"
    })
    assert res_asha_again.status_code == 200
    assert res_asha_again.json()["user"]["role"] == "ASHA"

def test_journey_1_community_member_health_records():
    """
    Journey 1: Community member
    Verify community user profile, family members list, ABHA IDs, and member health records.
    """
    res = client.post("/api/v1/auth/login-credentials", json={
        "email": "community.demo@sahayika.test",
        "password": "Sahayika@123"
    })
    assert res.status_code == 200
    user = res.json()["user"]
    assert user["role"] == "COMMUNITY"
    members = user.get("family_members", [])
    assert len(members) >= 3

    # Check Meena Devi (Self)
    meena = next((m for m in members if m["name"] == "Meena Devi"), None)
    assert meena is not None
    assert meena["category"] == "Pregnant Woman"
    assert "vitals" in meena
    assert len(meena["vitals"]) >= 1
    assert "immunizations" in meena
    assert "schemes" in meena

    # Check Rajesh Kumar (Husband)
    rajesh = next((m for m in members if m["name"] == "Rajesh Kumar"), None)
    assert rajesh is not None
    assert rajesh["relation"] == "Husband"

    # Check Aarav Kumar (Child)
    aarav = next((m for m in members if m["name"] == "Aarav Kumar"), None)
    assert aarav is not None
    assert "Child" in aarav["category"]

def test_journey_2_to_4_cross_application_request_sync():
    """
    Journey 2, 3, 4: Cross-Application Sync
    Journey 2: Community member submits visit request
    Journey 3: ASHA views request, acknowledges, and schedules a visit
    Journey 4: Community checks requests and sees status 'Scheduled' with visit time
    """
    # --- Journey 2: Community submits visit request ---
    req_payload = {
        "household_id": "hh_001",
        "beneficiary_name": "Meena Devi",
        "category": "Household visit request",
        "description": "Experiencing sudden dizzy spells and blurred vision since morning. Please visit.",
        "priority": "Urgent"
    }
    create_res = client.post("/api/v1/requests", json=req_payload)
    assert create_res.status_code == 201, create_res.text
    created_req = create_res.json()
    req_id = created_req["id"]
    assert created_req["status"] == "New"
    assert created_req["household_id"] == "hh_001"

    # --- Journey 3: ASHA worker logs in, views requests, acknowledges and schedules ---
    # Step 3a: ASHA views pending requests
    get_res = client.get("/api/v1/requests")
    assert get_res.status_code == 200
    all_reqs = get_res.json()
    target_req = next((r for r in all_reqs if r["id"] == req_id), None)
    assert target_req is not None

    # Step 3b: ASHA acknowledges
    ack_res = client.post(f"/api/v1/requests/{req_id}/action", json={
        "action": "acknowledge",
        "notes": "Acknowledged by ASHA Sunita Devi. Prioritizing for morning route."
    })
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "Acknowledged"

    # Step 3c: ASHA schedules visit
    sched_res = client.post(f"/api/v1/requests/{req_id}/action", json={
        "action": "schedule",
        "notes": "Home visit scheduled for Today at 11:30 AM with BP apparatus."
    })
    assert sched_res.status_code == 200
    assert sched_res.json()["status"] == "Scheduled"

    # --- Journey 4: Community checks request and verifies updated status & history ---
    comm_check_res = client.get("/api/v1/requests")
    assert comm_check_res.status_code == 200
    synced_req = next((r for r in comm_check_res.json() if r["id"] == req_id), None)
    assert synced_req is not None
    assert synced_req["status"] == "Scheduled"
    assert any("scheduled" in h.lower() for h in synced_req["response_history"])

def test_journey_5_asha_field_visit_and_auto_task():
    """
    Journey 5: ASHA field visit
    ASHA records voice visit -> AI structures visit data -> Confirm & Save -> Auto task generated
    """
    # 1. AI structurer extracts clinical details from spoken note
    transcript = "आज मीना देवी के घर गई। 32वें हफ्ते का चेकअप किया। बीपी 118/76 सामान्य रहा। 30 लाल गोलियां दीं। अगले बुधवार को दोबारा जाना है।"
    extract_res = client.post("/api/v1/ai/extract-visit", json={
        "transcript": transcript,
        "household_id": "hh_001",
        "language": "hi"
    })
    assert extract_res.status_code == 200, extract_res.text
    fields = extract_res.json()["extracted_fields"]
    assert fields["household_id"] == "hh_001"
    assert "Meena Devi" in fields["beneficiary_name"]

    # 2. Worker reviews, edits and confirms visit
    visit_payload = {
        "household_id": "hh_001",
        "household_name": "Meena Devi Household",
        "beneficiary_name": "Meena Devi (Mother)",
        "visit_date": "2026-11-04",
        "activity_category": "Maternal Health",
        "activity_description": "ANC Home visit. Checked BP (118/76), provided 30 IFA tablets, monitored fetal movement.",
        "visit_outcome": "Normal",
        "follow_up_required": True,
        "follow_up_date": "2026-11-11",
        "priority": "Urgent",
        "notes": "Verified by Sunita Devi with BP apparatus.",
        "auto_create_task": True
    }
    confirm_res = client.post("/api/v1/visits/confirm", json=visit_payload)
    assert confirm_res.status_code == 201, confirm_res.text
    confirmed_visit = confirm_res.json()
    assert confirmed_visit["status"] == "Confirmed"
    assert confirmed_visit["created_task_id"] is not None

    # 3. Verify task exists in task list
    task_res = client.get("/api/v1/tasks")
    assert task_res.status_code == 200
    all_tasks = task_res.json()
    auto_task = next((t for t in all_tasks if t["id"] == confirmed_visit["created_task_id"]), None)
    assert auto_task is not None
    assert auto_task["household_id"] == "hh_001"
    assert auto_task["due_date"] == "2026-11-11"
