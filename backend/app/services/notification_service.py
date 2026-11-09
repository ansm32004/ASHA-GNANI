from typing import List, Optional, Dict, Any
from app.repositories.notification_repository import notification_repo
from app.core.exceptions import NotFoundException

class NotificationService:
    def list_notifications(
        self,
        category: Optional[str] = None,
        unread_only: bool = False,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return notification_repo.list_all(category=category, unread_only=unread_only, user_id=user_id)

    def mark_read(self, notif_id: str) -> Dict[str, Any]:
        notif = notification_repo.mark_as_read(notif_id)
        if not notif:
            raise NotFoundException("Notification", notif_id)
        return notif

    def mark_all_read(self) -> Dict[str, Any]:
        count = notification_repo.mark_all_as_read()
        return {"marked_read_count": count}

notification_service = NotificationService()

