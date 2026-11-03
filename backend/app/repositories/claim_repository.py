from typing import List, Optional, Dict, Any
from app.repositories.mock_data import generate_mock_claims, DEMO_USER
from datetime import datetime

class ClaimRepository:
    def __init__(self):
        self._claims: List[Dict[str, Any]] = generate_mock_claims()

    def list_all(self) -> List[Dict[str, Any]]:
        return self._claims

    def get_by_id(self, claim_id: str) -> Optional[Dict[str, Any]]:
        for c in self._claims:
            if c["id"] == claim_id:
                return c
        return None

    def prepare_claim(self, month: str, year: int = 2026, activity_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        # Configurable illustrative mock activities
        sample_activities = [
            {
                "id": "act_new_01",
                "activity_date": f"{year}-11-02",
                "category": "Maternal health",
                "description": "Antenatal checkup assistance & birth planning for Meena Devi",
                "household_id": "hh_001",
                "beneficiary_name": "Meena Devi",
                "eligible_for_claim": True,
                "incentive_code": "ASHA-MCH-01",
                "estimated_amount": 300,
                "status": "Verified"
            },
            {
                "id": "act_new_02",
                "activity_date": f"{year}-11-01",
                "category": "Child health",
                "description": "Postnatal home visit (Day 7) for newborn of Rekha Sharma",
                "household_id": "hh_002",
                "beneficiary_name": "Golu Sharma",
                "eligible_for_claim": True,
                "incentive_code": "ASHA-HBNC-02",
                "estimated_amount": 250,
                "status": "Verified"
            },
            {
                "id": "act_new_03",
                "activity_date": f"{year}-10-29",
                "category": "Immunisation",
                "description": "Mobilised 6 children for Wednesday session at Anganwadi",
                "household_id": "hh_004",
                "beneficiary_name": "Ananya Singh & others",
                "eligible_for_claim": True,
                "incentive_code": "ASHA-IMM-01",
                "estimated_amount": 400,
                "status": "Verified"
            },
            {
                "id": "act_new_04",
                "activity_date": f"{year}-10-27",
                "category": "Community mobilisation",
                "description": "Participated in Village Health Sanitation and Nutrition Committee meeting",
                "household_id": "hh_003",
                "beneficiary_name": "VHSNC Members",
                "eligible_for_claim": True,
                "incentive_code": "ASHA-COMM-01",
                "estimated_amount": 150,
                "status": "Verified"
            },
            {
                "id": "act_new_05",
                "activity_date": f"{year}-10-25",
                "category": "Health awareness",
                "description": "Conducted Poshan awareness and anemia screening dialogue in Ward 3",
                "household_id": "hh_005",
                "beneficiary_name": "Kisan Basti Families",
                "eligible_for_claim": True,
                "incentive_code": "ASHA-NUTR-01",
                "estimated_amount": 200,
                "status": "Verified"
            }
        ]

        total_amount = sum(a["estimated_amount"] for a in sample_activities)
        claim_id = f"claim_{year}_{month.lower().replace(' ', '_')}"

        new_claim = {
            "id": claim_id,
            "month": month,
            "year": year,
            "asha_id": DEMO_USER["id"],
            "asha_name": DEMO_USER["name"],
            "activities_count": len(sample_activities),
            "activities": sample_activities,
            "total_estimated_amount": total_amount,
            "status": "Draft",
            "submitted_at": None,
            "verified_at": None,
            "payment_status": "Pending",
            "supervisor_notes": "Draft prepared. Ready for ASHA review and submission to ANM/MO.",
            "disclaimer": "Disclaimer: Amounts and eligibility rules shown are illustrative for demonstration and claim-preparation assistance, not official government determinations."
        }
        
        # Check if already in list
        existing = self.get_by_id(claim_id)
        if existing:
            return existing
        self._claims.insert(0, new_claim)
        return new_claim

    def submit_claim(self, claim_id: str) -> Optional[Dict[str, Any]]:
        record = self.get_by_id(claim_id)
        if not record:
            return None
        record["status"] = "Submitted for Review"
        record["submitted_at"] = datetime.now().isoformat() + "Z"
        record["payment_status"] = "Under Verification"
        record["supervisor_notes"] = "Claim submitted to Medical Officer & ANM for verification against RCH register."
        return record

claim_repo = ClaimRepository()

