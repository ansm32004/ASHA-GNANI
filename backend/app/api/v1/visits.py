from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from app.schemas.visit import VisitResponse, VisitConfirmRequest, VisitDraftRequest
from app.services.visit_service import visit_service
from app.core.dependencies import get_current_user_id

router = APIRouter(prefix="/visits", tags=["Visits"])

@router.get("", response_model=List[VisitResponse])
def get_visits(
    household_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user: str = Depends(get_current_user_id)
):
    """
    List field visit history.
    """
    return visit_service.list_visits(household_id=household_id, category=category)

@router.post("/confirm", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
def confirm_visit(payload: VisitConfirmRequest, current_user: str = Depends(get_current_user_id)):
    """
    Confirm an AI-interpreted or manually edited field visit record.
    Automatically generates a follow-up task if follow-up is requested.
    """
    return visit_service.confirm_visit(payload.model_dump())

@router.get("/{visit_id}", response_model=VisitResponse)
def get_visit_details(visit_id: str, current_user: str = Depends(get_current_user_id)):
    """
    Get detailed record of a visit.
    """
    return visit_service.get_visit(visit_id)

