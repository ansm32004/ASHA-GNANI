from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.schemas.notification import NotificationResponse
from app.services.notification_service import notification_service
from app.core.dependencies import get_current_user_id

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    category: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    current_user: str = Depends(get_current_user_id)
):
    """
    Get notifications with unread and category filters.
    """
    return notification_service.list_notifications(category=category, unread_only=unread_only)

@router.post("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(notification_id: str, current_user: str = Depends(get_current_user_id)):
    """
    Mark a notification as read.
    """
    return notification_service.mark_read(notification_id)

@router.post("/read-all")
def mark_all_notifications_read(current_user: str = Depends(get_current_user_id)):
    """
    Mark all notifications as read.
    """
    return notification_service.mark_all_read()

