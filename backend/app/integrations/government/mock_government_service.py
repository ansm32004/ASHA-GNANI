from typing import Dict, Any, List
from app.integrations.government.activity_rules import INCENTIVE_NORMS, get_incentive_by_category

class MockGovernmentHealthService:
    """
    Simulated gateway to state/national health infrastructure (RCH, Anmol, Poshan Tracker).
    Prepares payloads and simulates eligibility verification.
    """
    def check_activity_eligibility(self, activity: Dict[str, Any]) -> Dict[str, Any]:
        cat = activity.get("category", "General")
        norm = get_incentive_by_category(cat)
        
        return {
            "eligible": True,
            "incentive_code": norm["code"],
            "title": norm["title"],
            "rate": norm["rate"],
            "criteria": norm["eligibility_criteria"]
        }

    def simulate_supervisor_review(self, claim_id: str) -> Dict[str, Any]:
        return {
            "status": "Approved by MO/ANM",
            "reviewed_by": "Dr. V. K. Sharma (Medical Officer, Kashi PHC)",
            "verification_status": "All records matched with Sub-centre physical register"
        }

gov_service = MockGovernmentHealthService()

