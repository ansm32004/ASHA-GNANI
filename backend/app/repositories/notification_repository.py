from typing import List, Optional, Dict, Any
from app.repositories.mock_data import generate_mock_notifications
from datetime import datetime

class NotificationRepository:
    def __init__(self):
        self._notifications: List[Dict[str, Any]] = generate_mock_notifications()

    def list_all(self, category: Optional[str] = None, unread_only: bool = False) -> List[Dict[str, Any]]:
        results = self._notifications.copy()
        if category and category != "All":
            results = [n for n in results if n.get("category", "").lower() == category.lower()]
        if unread_only:
            results = [n for n in results if not n.get("is_read", False)]
        return results

    def mark_as_read(self, notif_id: str) -> Optional[Dict[str, Any]]:
        for n in self._notifications:
            if n["id"] == notif_id:
                n["is_read"] = True
                return n
        return None

    def mark_all_as_read(self) -> int:
        count = 0
        for n in self._notifications:
            if not n["is_read"]:
                n["is_read"] = True
                count += 1
        return count

notification_repo = NotificationRepository()

