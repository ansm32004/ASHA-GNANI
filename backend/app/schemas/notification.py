from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    category: str  # Upcoming visit, Follow-up due, Community request, Urgent request, Claim status, Payment status, Health camp, System
    priority: str = "Medium"  # Urgent, High, Medium, Low
    is_read: bool = False
    timestamp: str
    action_type: Optional[str] = None
    action_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class DeviceTokenRegisterRequest(BaseModel):
    token: str
    platform: Optional[str] = "android"

class TestPushRequest(BaseModel):
    title: Optional[str] = "SAHAYIKA Test Alert"
    body: Optional[str] = "This is a test notification from SAHAYIKA Cloud Messaging."
    data: Optional[Dict[str, str]] = None

class TestPushResponse(BaseModel):
    status: str
    delivered: bool
    message: str
    recipient_id: str
    token_used: Optional[str] = None
