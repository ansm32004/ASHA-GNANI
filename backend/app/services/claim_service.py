from typing import List, Optional, Dict, Any
from app.repositories.claim_repository import claim_repo
from app.core.exceptions import NotFoundException, ValidationException

class ClaimService:
    def list_claims(self) -> List[Dict[str, Any]]:
        return claim_repo.list_all()

    def get_claim(self, claim_id: str) -> Dict[str, Any]:
        claim = claim_repo.get_by_id(claim_id)
        if not claim:
            raise NotFoundException("Claim", claim_id)
        return claim

    def prepare_claim(self, month: str, year: int = 2026, activity_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        return claim_repo.prepare_claim(month=month, year=year, activity_ids=activity_ids)

    def submit_claim(self, claim_id: str) -> Dict[str, Any]:
        claim = claim_repo.submit_claim(claim_id)
        if not claim:
            raise NotFoundException("Claim", claim_id)
        return claim

claim_service = ClaimService()

