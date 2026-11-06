from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from app.schemas.request import RequestResponse, RequestCreate, RequestAction
from app.services.request_service import request_service
from app.services.auth_service import auth_service
from app.core.dependencies import get_current_user_id
from app.core.exceptions import ForbiddenException

router = APIRouter(prefix="/requests", tags=["Community Requests"])

@router.get("", response_model=List[RequestResponse])
def get_requests(
    status: Optional[str] = Query(None, description="New, Acknowledged, In progress, Resolved, Escalated"),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    household_id: Optional[str] = Query(None),
    current_user: str = Depends(get_current_user_id)
):
    """
    List community requests received from households and beneficiaries.
    Enforces role isolation: Community members can only see their own household's requests.
    """
    profile = auth_service.get_current_user_profile(current_user)
    if profile.get("role") == "COMMUNITY":
        user_hh = profile.get("household_id")
        return request_service.list_requests(
            status=status,
            category=category,
            priority=priority,
            household_id=user_hh
        )

    # For ASHA, filter to requests assigned to this ASHA or their clusters
    return request_service.list_requests(
        status=status,
        category=category,
        priority=priority,
        household_id=household_id,
        assigned_asha_id=current_user
    )

@router.post("", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(payload: RequestCreate, current_user: str = Depends(get_current_user_id)):
    """
    Submit a new community request.
    If submitted by a community member, forces household_id to their authenticated household.
    """
    profile = auth_service.get_current_user_profile(current_user)
    data = payload.model_dump()
    if profile.get("role") == "COMMUNITY":
        data["household_id"] = profile.get("household_id")
    return request_service.create_request(data)

@router.post("/{request_id}/action", response_model=RequestResponse)
def act_on_request(request_id: str, payload: RequestAction, current_user: str = Depends(get_current_user_id)):
    """
    Perform action on a request: Acknowledge, Schedule visit, In_progress, Resolve, or Escalate.
    Only ASHA workers or supervisors can act on community requests.
    """
    profile = auth_service.get_current_user_profile(current_user)
    if profile.get("role") == "COMMUNITY":
        raise ForbiddenException("Community beneficiaries cannot modify or action requests.")

    return request_service.process_action(request_id, payload.action, payload.notes)

