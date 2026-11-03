from typing import Dict, Any, Optional
from app.integrations.firebase.firebase_admin import firebase_manager
from app.core.logging import logger

class FirebaseMessagingService:
    def send_push_notification(self, token: str, title: str, body: str, data: Optional[Dict[str, str]] = None) -> bool:
        if firebase_manager.is_connected:
            try:
                from firebase_admin import messaging
                message = messaging.Message(
                    notification=messaging.Notification(title=title, body=body),
                    data=data or {},
                    token=token
                )
                messaging.send(message)
                return True
            except Exception as e:
                logger.error(f"FCM error: {e}")
        
        logger.info(f"[MockFCM] Sent Push: '{title}' - '{body}' to {token[:10]}...")
        return True

firebase_messaging = FirebaseMessagingService()

