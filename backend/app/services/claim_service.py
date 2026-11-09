from typing import List, Optional, Dict, Any
from app.repositories.claim_repository import claim_repo
from app.core.exceptions import NotFoundException, ValidationException

class ClaimService:
    def list_claims(self, asha_id: Optional[str] = None) -> List[Dict[str, Any]]:
        return claim_repo.list_all(asha_id=asha_id)

    def get_claim(self, claim_id: str) -> Dict[str, Any]:
        claim = claim_repo.get_by_id(claim_id)
        if not claim:
            raise NotFoundException("Claim", claim_id)
        return claim

    def create_claim(self, claim_data: Dict[str, Any], asha_id: str, asha_name: str) -> Dict[str, Any]:
        try:
            return claim_repo.create_claim(claim_data, asha_id=asha_id, asha_name=asha_name)
        except ValueError as e:
            raise ValidationException(str(e))

    def prepare_claim(self, month: str, year: int = 2026, activity_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        return claim_repo.prepare_claim(month=month, year=year, activity_ids=activity_ids)

    def submit_claim(self, claim_id: str) -> Dict[str, Any]:
        claim = claim_repo.submit_claim(claim_id)
        if not claim:
            raise NotFoundException("Claim", claim_id)
        return claim

    def get_overview(self, asha_id: Optional[str] = None) -> Dict[str, Any]:
        return claim_repo.get_overview(asha_id=asha_id)

    def get_guidelines(self, state: Optional[str] = "Delhi") -> List[Dict[str, Any]]:
        return claim_repo.get_guidelines(state=state)

claim_service = ClaimService()
