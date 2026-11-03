from typing import Dict, Any, List
from app.integrations.government.mock_government_service import gov_service

class ClaimAdapter:
    def format_for_state_portal(self, claim: Dict[str, Any]) -> Dict[str, Any]:
        """
        Formats internal claim representation into state portal submission standard.
        """
        return {
            "state_claim_id": f"UP-NHM-{claim['id']}",
            "asha_id": claim["asha_id"],
            "period": f"{claim['month']} {claim['year']}",
            "total_activities": claim["activities_count"],
            "claimed_amount_inr": claim["total_estimated_amount"],
            "verification_channel": "Direct ANM Gateway"
        }

claim_adapter = ClaimAdapter()

