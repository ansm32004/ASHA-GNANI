from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from app.schemas.request import RequestResponse, RequestCreate, RequestAction
from app.services.request_service import request_service
from app.core.dependencies import get_current_user_id

router = APIRouter(prefix="/requests", tags=["Community Requests"])

@router.get("", response_model=List[RequestResponse])
def get_requests(
    status: Optional[str] = Query(None, description="New, Acknowledged, In progress, Resolved, Escalated"),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    current_user: str = Depends(get_current_user_id)
):
    """
    List community requests received from households and beneficiaries.
    """
    return request_service.list_requests(status=status, category=category, priority=priority)

@router.post("", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(payload: RequestCreate, current_user: str = Depends(get_current_user_id)):
    """
    Simulate/log a new community request (architected for community app integration).
    """
    return request_service.create_request(payload.model_dump())

@router.post("/{request_id}/action", response_model=RequestResponse)
def act_on_request(request_id: str, payload: RequestAction, current_user: str = Depends(get_current_user_id)):
    """
    Perform action on a request: Acknowledge, In_progress, Resolve, or Escalate.
    """
    return request_service.process_action(request_id, payload.action, payload.notes)

