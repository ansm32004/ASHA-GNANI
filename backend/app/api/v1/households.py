from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from app.schemas.household import HouseholdResponse, HouseholdCreate, HouseholdUpdate
from app.services.household_service import household_service
from app.services.auth_service import auth_service
from app.core.dependencies import get_current_user_id
from app.core.exceptions import ForbiddenException

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
    Enforces role isolation: Community members can only see their own household.
    """
    profile = auth_service.get_current_user_profile(current_user)
    records = household_service.list_households(search=search, village=village, priority=priority, has_pending=has_pending)
    
    # Community role isolation
    if profile.get("role") == "COMMUNITY":
        user_hh = profile.get("household_id")
        records = [r for r in records if r.get("id") == user_hh or r.get("household_id") == user_hh]
    elif profile.get("role") == "ASHA":
        assigned_clusters = profile.get("assigned_clusters") or []
        if assigned_clusters:
            if village and village != "All" and village not in assigned_clusters:
                records = []
            else:
                records = [r for r in records if r.get("village") in assigned_clusters or r.get("assigned_asha_id") == current_user]
        else:
            records = [r for r in records if r.get("assigned_asha_id") == current_user]

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
    Only ASHA workers or supervisors can create new households.
    """
    profile = auth_service.get_current_user_profile(current_user)
    if profile.get("role") == "COMMUNITY":
        raise ForbiddenException("Community members cannot register new households.")

    created = household_service.create_household(payload.model_dump(), asha_id=current_user)
    return {**created, "members_count": len(created.get("members", []))}

@router.get("/{household_id}", response_model=HouseholdResponse)
def get_household_details(household_id: str, current_user: str = Depends(get_current_user_id)):
    """
    Retrieve full profile of a specific household including all family members.
    Enforces role isolation: Community members cannot view other households.
    ASHA workers cannot view households outside their assigned village clusters.
    """
    profile = auth_service.get_current_user_profile(current_user)
    hh = household_service.get_household(household_id)

    if profile.get("role") == "COMMUNITY":
        user_hh = profile.get("household_id")
        if household_id != user_hh and hh.get("household_id") != user_hh and hh.get("id") != user_hh:
            raise ForbiddenException("You cannot access another family's household records.")

    elif profile.get("role") == "ASHA":
        assigned_clusters = profile.get("assigned_clusters") or []
        if assigned_clusters and hh.get("village") not in assigned_clusters and hh.get("assigned_asha_id") != current_user:
            raise ForbiddenException("You cannot access households outside your assigned village cluster.")

    return {**hh, "members_count": len(hh.get("members", []))}

@router.patch("/{household_id}", response_model=HouseholdResponse)
def update_household(household_id: str, payload: HouseholdUpdate, current_user: str = Depends(get_current_user_id)):
    """
    Update household details.
    """
    profile = auth_service.get_current_user_profile(current_user)
    if profile.get("role") == "COMMUNITY":
        user_hh = profile.get("household_id")
        if household_id != user_hh:
            hh_check = household_service.get_household(household_id)
            if hh_check.get("household_id") != user_hh and hh_check.get("id") != user_hh:
                raise ForbiddenException("You cannot modify another family's household records.")

    updated = household_service.update_household(household_id, payload.model_dump(exclude_unset=True))
    return {**updated, "members_count": len(updated.get("members", []))}

@router.delete("/{household_id}")
def delete_household(household_id: str, current_user: str = Depends(get_current_user_id)):
    """
    Delete a household record.
    """
    profile = auth_service.get_current_user_profile(current_user)
    if profile.get("role") == "COMMUNITY":
        raise ForbiddenException("Community members cannot delete household records.")
    
    household_service.delete_household(household_id)
    return {"message": "Household deleted successfully", "id": household_id}

