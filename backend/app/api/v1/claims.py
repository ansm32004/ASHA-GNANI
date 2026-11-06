from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from app.schemas.claim import ClaimResponse, ClaimPrepareRequest
from app.services.claim_service import claim_service
from app.services.auth_service import auth_service
from app.core.dependencies import get_current_user_id
from app.core.exceptions import ForbiddenException

router = APIRouter(prefix="/claims", tags=["Work Records & Incentive Assistant"])

def _assert_asha_or_supervisor(current_user: str):
    profile = auth_service.get_current_user_profile(current_user)
    if profile.get("role") == "COMMUNITY":
        raise ForbiddenException("Community members cannot view or manage ASHA incentive claims.")

@router.get("", response_model=List[ClaimResponse])
def get_claims(current_user: str = Depends(get_current_user_id)):
    """
    List monthly activity records and claim history.
    """
    _assert_asha_or_supervisor(current_user)
    return claim_service.list_claims()

@router.post("/prepare", response_model=ClaimResponse)
def prepare_claim(payload: ClaimPrepareRequest, current_user: str = Depends(get_current_user_id)):
    """
    Prepare draft claim grouping eligible activities for given month.
    """
    _assert_asha_or_supervisor(current_user)
    return claim_service.prepare_claim(month=payload.month, activity_ids=payload.activity_ids)

@router.post("/{claim_id}/submit", response_model=ClaimResponse)
def submit_claim(claim_id: str, current_user: str = Depends(get_current_user_id)):
    """
    Submit draft claim for supervisor (ANM/MO) verification workflow.
    """
    _assert_asha_or_supervisor(current_user)
    return claim_service.submit_claim(claim_id)

@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim_details(claim_id: str, current_user: str = Depends(get_current_user_id)):
    """
    Get detailed claim report with all itemized activities.
    """
    _assert_asha_or_supervisor(current_user)
    return claim_service.get_claim(claim_id)

