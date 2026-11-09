from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from app.schemas.claim import (
    ClaimResponse,
    ClaimPrepareRequest,
    CreateClaimRequest,
    IncentiveGuideline,
    EarningsOverview
)
from app.services.claim_service import claim_service
from app.services.auth_service import auth_service
from app.core.dependencies import get_current_user_id
from app.core.exceptions import ForbiddenException

router = APIRouter(prefix="/claims", tags=["Work Records & Incentive Assistant"])

def _assert_asha_or_supervisor(current_user: str):
    profile = auth_service.get_current_user_profile(current_user)
    if profile.get("role") == "COMMUNITY":
        raise ForbiddenException("Community members cannot view or manage ASHA incentive claims.")
    return profile

@router.get("", response_model=List[ClaimResponse])
def get_claims(current_user: str = Depends(get_current_user_id)):
    """
    List monthly activity records and claim history for the authenticated ASHA worker.
    """
    profile = _assert_asha_or_supervisor(current_user)
    asha_id = profile.get("id", current_user)
    return claim_service.list_claims(asha_id=asha_id)

@router.get("/overview", response_model=EarningsOverview)
def get_earnings_overview(current_user: str = Depends(get_current_user_id)):
    """
    Get dynamic calculated earnings overview: Total Earned, Pending Claims, Eligible to Claim, Paid.
    """
    profile = _assert_asha_or_supervisor(current_user)
    asha_id = profile.get("id", current_user)
    return claim_service.get_overview(asha_id=asha_id)

@router.get("/guidelines", response_model=List[IncentiveGuideline])
def get_guidelines(
    state: Optional[str] = Query("Delhi", description="State for state-specific incentive guidelines"),
    current_user: str = Depends(get_current_user_id)
):
    """
    Get configurable incentive guidelines (Central fixed, Performance-based, Ayushman Arogya Mandir team, State top-ups).
    """
    _assert_asha_or_supervisor(current_user)
    return claim_service.get_guidelines(state=state)

@router.post("", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
def create_custom_claim(payload: CreateClaimRequest, current_user: str = Depends(get_current_user_id)):
    """
    Create and submit a new incentive claim for completed healthcare activities with duplicate checking.
    """
    profile = _assert_asha_or_supervisor(current_user)
    asha_id = profile.get("id", current_user)
    asha_name = profile.get("name", "Sunita Devi")

    claim_dict = payload.model_dump()
    return claim_service.create_claim(claim_dict, asha_id=asha_id, asha_name=asha_name)

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
    Get detailed claim report with all itemized activities and verification status.
    """
    _assert_asha_or_supervisor(current_user)
    return claim_service.get_claim(claim_id)
