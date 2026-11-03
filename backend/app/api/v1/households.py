from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from app.schemas.household import HouseholdResponse, HouseholdCreate, HouseholdUpdate
from app.services.household_service import household_service
from app.core.dependencies import get_current_user_id

router = APIRouter(prefix="/households", tags=["Households"])

@router.get("", response_model=List[HouseholdResponse])
def get_households(
    search: Optional[str] = Query(None, description="Search by household name, ID, or member name"),
    village: Optional[str] = Query(None, description="Filter by assigned village"),
    priority: Optional[str] = Query(None, description="Filter by priority (Urgent, Priority, Routine)"),
    has_pending: Optional[bool] = Query(None, description="Filter by pending follow-up status"),
    current_user: str = Depends(get_current_user_id)
):
    """
    List assigned households with flexible search and filtering.
    """
    records = household_service.list_households(search=search, village=village, priority=priority, has_pending=has_pending)
    # Map to schema
    formatted = []
    for r in records:
        item = {**r, "members_count": len(r.get("members", []))}
        formatted.append(item)
    return formatted

@router.post("", response_model=HouseholdResponse, status_code=status.HTTP_201_CREATED)
def create_household(payload: HouseholdCreate, current_user: str = Depends(get_current_user_id)):
    """
    Register a new household under assigned village cluster.
    """
    created = household_service.create_household(payload.model_dump())
    return {**created, "members_count": len(created.get("members", []))}

@router.get("/{household_id}", response_model=HouseholdResponse)
def get_household_details(household_id: str, current_user: str = Depends(get_current_user_id)):
    """
    Retrieve full profile of a specific household including all family members.
    """
    hh = household_service.get_household(household_id)
    return {**hh, "members_count": len(hh.get("members", []))}

@router.patch("/{household_id}", response_model=HouseholdResponse)
def update_household(household_id: str, payload: HouseholdUpdate, current_user: str = Depends(get_current_user_id)):
    """
    Update household details.
    """
    updated = household_service.update_household(household_id, payload.model_dump(exclude_unset=True))
    return {**updated, "members_count": len(updated.get("members", []))}

