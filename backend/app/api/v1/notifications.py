from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from app.schemas.notification import (
    NotificationResponse,
    DeviceTokenRegisterRequest,
    TestPushRequest,
    TestPushResponse
)
from app.services.notification_service import notification_service
from app.integrations.firebase.messaging_service import firebase_messaging
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

@router.post("/device-token", status_code=status.HTTP_200_OK)
def register_device_token(payload: DeviceTokenRegisterRequest, current_user: str = Depends(get_current_user_id)):
    """
    Register FCM device token for authenticated user to enable background push alerts.
    """
    firebase_messaging.register_device_token(
        user_id=current_user,
        token=payload.token,
        platform=payload.platform or "android"
    )
    return {"status": "success", "message": "Device token registered successfully"}

@router.delete("/device-token", status_code=status.HTTP_200_OK)
def unregister_device_token(current_user: str = Depends(get_current_user_id)):
    """
    Unregister FCM device token when user logs out.
    """
    firebase_messaging.unregister_device_token(user_id=current_user)
    return {"status": "success", "message": "Device token unregistered successfully"}

@router.post("/test-push", response_model=TestPushResponse)
def send_test_push(
    payload: Optional[TestPushRequest] = None,
    current_user: str = Depends(get_current_user_id)
):
    """
    Send an authenticated test push notification to the current user's registered device.
    """
    title = payload.title if payload and payload.title else "SAHAYIKA Test Alert"
    body = payload.body if payload and payload.body else "This is a test notification from SAHAYIKA Cloud Messaging."
    data = payload.data if payload and payload.data else {"type": "test_alert"}

    token = firebase_messaging.get_token_for_user(current_user)
    if not token:
        return TestPushResponse(
            status="warning",
            delivered=False,
            message="No device token registered for current user. Please register a token first.",
            recipient_id=current_user,
            token_used=None
        )

    delivered = firebase_messaging.send_to_user(
        user_id=current_user,
        title=title,
        body=body,
        data=data
    )

    token_preview = token[:12] + "..." if len(token) > 12 else token

    return TestPushResponse(
        status="success" if delivered else "failed",
        delivered=delivered,
        message="Test push dispatched successfully" if delivered else "Failed to dispatch test push notification",
        recipient_id=current_user,
        token_used=token_preview
    )
