from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from app.schemas.visit import VisitResponse, VisitConfirmRequest, VisitDraftRequest
from app.services.visit_service import visit_service
from app.services.auth_service import auth_service
from app.core.dependencies import get_current_user_id
from app.core.exceptions import ForbiddenException, NotFoundException

router = APIRouter(prefix="/visits", tags=["Visits"])

@router.get("", response_model=List[VisitResponse])
def get_visits(
    household_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: str = Depends(get_current_user_id)
):
    """
    List field visit history.
    Enforces role isolation: Community members can only see visits for their assigned household.
    """
    profile = auth_service.get_current_user_profile(current_user)
    if profile.get("role") == "COMMUNITY":
        user_hh = profile.get("household_id")
        return visit_service.list_visits(household_id=user_hh, category=category)
    return visit_service.list_visits(household_id=household_id, category=category, asha_id=current_user)

@router.post("/confirm", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
def confirm_visit(payload: VisitConfirmRequest, current_user: str = Depends(get_current_user_id)):
    """
    Confirm an AI-interpreted or manually edited field visit record.
    Automatically generates a follow-up task if follow-up is requested.
    Only ASHA workers or supervisors can log field visits.
    """
    profile = auth_service.get_current_user_profile(current_user)
    if profile.get("role") == "COMMUNITY":
        raise ForbiddenException("Community beneficiaries cannot log or confirm field visits.")

    return visit_service.confirm_visit(payload.model_dump(), asha_id=current_user)

@router.get("/{visit_id}", response_model=VisitResponse)
def get_visit_details(visit_id: str, current_user: str = Depends(get_current_user_id)):
    """
    Get detailed record of a visit.
    Enforces role isolation: Community members cannot view visits belonging to other households.
    """
    visit = visit_service.get_visit(visit_id)
    profile = auth_service.get_current_user_profile(current_user)
    if profile.get("role") == "COMMUNITY":
        user_hh = profile.get("household_id")
        if visit.get("household_id") != user_hh:
            raise ForbiddenException("Access denied to visit records outside your household.")
    return visit

