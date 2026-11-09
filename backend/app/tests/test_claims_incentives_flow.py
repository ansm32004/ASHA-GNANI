import pytest
from app.repositories.claim_repository import claim_repo
from app.services.claim_service import claim_service
from app.core.exceptions import ValidationException

def test_claims_overview_calculation():
    overview = claim_service.get_overview("asha_sunita_001")
    assert "total_earned" in overview
    assert "pending_claims" in overview
    assert "eligible_to_claim" in overview
    assert "paid" in overview
    assert overview["total_earned"] >= 0
    assert overview["paid"] >= 4200  # September claim is disbursed (₹4,200)
    assert overview["pending_claims"] >= 3450  # October claim is under verification (₹3,450)
    assert overview["status_counts"]["Rejected"] >= 1  # August claim is rejected

def test_incentive_guidelines():
    guidelines = claim_service.get_guidelines("Delhi")
    assert len(guidelines) >= 5

    categories = [g["category"] for g in guidelines]
    assert "central_fixed" in categories
    assert "performance_based" in categories
    assert "team_incentive" in categories
    assert "state_incentive" in categories

    # Verify Central Fixed is ₹3,500
    central = next(g for g in guidelines if g["category"] == "central_fixed")
    assert central["amount_value"] == 3500

    # Verify Delhi state incentive has announced increase note requiring official verification
    delhi = next(g for g in guidelines if g["category"] == "state_incentive")
    assert "6,000" in delhi["amount_display"]
    assert delhi["status"] == "guideline_pending_verification"

def test_create_and_submit_claim_flow():
    # 1. Create a new custom claim
    payload = {
        "month": "December",
        "year": 2026,
        "category": "Maternal Health",
        "activities": [
            {
                "activity_type": "Pregnancy registration and antenatal care follow-ups",
                "category": "Maternal health",
                "activity_date": "2026-12-01",
                "household_id": "hh_001",
                "beneficiary_name": "Kavita Sharma",
                "completed_count": 2,
                "notes": "2 ANC checkups completed"
            },
            {
                "activity_type": "Institutional delivery support",
                "category": "Maternal health",
                "activity_date": "2026-12-02",
                "household_id": "hh_002",
                "beneficiary_name": "Pooja Verma",
                "completed_count": 1,
                "notes": "Accompanied to Kashi PHC for delivery"
            }
        ],
        "supporting_notes": "RCH register verified with ANM Maya."
    }

    new_claim = claim_service.create_claim(payload, asha_id="asha_sunita_001", asha_name="Sunita Devi")
    assert new_claim["id"].startswith("CLM-2026-DEC-")
    assert new_claim["status"] == "Submitted for Review"
    assert new_claim["payment_status"] == "Under Verification"
    # ANC: 2 * 300 = 600, Delivery: 1 * 600 = 600 -> Total = 1200
    assert new_claim["total_estimated_amount"] == 1200
    assert len(new_claim["activities"]) == 2

    # 2. Test duplicate prevention: attempting to create identical claim should fail
    with pytest.raises(ValidationException):
        claim_service.create_claim(payload, asha_id="asha_sunita_001", asha_name="Sunita Devi")

    # 3. Test retrieving created claim
    fetched = claim_service.get_claim(new_claim["id"])
    assert fetched["id"] == new_claim["id"]
    assert fetched["total_estimated_amount"] == 1200
