import uuid
from typing import List, Optional, Dict, Any
from app.config import settings
from app.repositories.mock_data import generate_mock_notifications
from app.integrations.firebase.firestore_repository import FirestoreRepository
from app.core.logging import logger
from datetime import datetime

class NotificationRepository:
    def __init__(self):
        self._firestore = FirestoreRepository("notifications")
        self._notifications: List[Dict[str, Any]] = generate_mock_notifications()
        self._initialized_db = False

    def _ensure_synced(self):
        if not self._firestore.is_connected:
            return
        if not self._initialized_db:
            try:
                self._firestore.seed_if_empty(self._notifications, id_key="id")
                remote_docs = self._firestore.list_all()
                if remote_docs:
                    self._notifications = remote_docs
                self._initialized_db = True
            except Exception as e:
                logger.warning(f"NotificationRepository sync warning: {e}")

    def list_all(
        self,
        category: Optional[str] = None,
        unread_only: bool = False,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        self._ensure_synced()
        if self._firestore.is_connected:
            try:
                remote_docs = self._firestore.list_all()
                if remote_docs:
                    self._notifications = remote_docs
            except Exception as e:
                logger.warning(f"Could not refresh notifications from Firestore: {e}")

        results = self._notifications.copy()
        if user_id:
            results = [n for n in results if n.get("userId") is None or n.get("userId") == user_id]
        if category and category != "All":
            results = [n for n in results if n.get("category", "").lower() == category.lower()]
        if unread_only:
            results = [n for n in results if not n.get("is_read", False)]
        return results

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        self._ensure_synced()
        new_id = data.get("id") or f"notif_{uuid.uuid4().hex[:10]}"
        now_iso = datetime.now().isoformat() + "Z"
        record = {
            "id": new_id,
            "title": data["title"],
            "message": data["message"],
            "category": data.get("category", "Urgent request"),
            "priority": data.get("priority", "Medium"),
            "is_read": data.get("is_read", False),
            "timestamp": data.get("timestamp") or "Just now",
            "userId": data.get("userId"),
            "created_at": now_iso
        }
        if self._firestore.is_connected:
            self._firestore.set(new_id, record)
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot send notification.")

        self._notifications.insert(0, record)
        return record

    def mark_as_read(self, notif_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_synced()
        for n in self._notifications:
            if n["id"] == notif_id:
                n["is_read"] = True
                if self._firestore.is_connected:
                    self._firestore.update(notif_id, {"is_read": True})
                elif not getattr(settings, "DEMO_MODE", False):
                    raise RuntimeError("Cloud Firestore is disconnected in live mode.")
                return n
        return None

    def mark_all_as_read(self) -> int:
        self._ensure_synced()
        count = 0
        for n in self._notifications:
            if not n["is_read"]:
                n["is_read"] = True
                count += 1
                if self._firestore.is_connected:
                    self._firestore.update(n["id"], {"is_read": True})
                elif not getattr(settings, "DEMO_MODE", False):
                    raise RuntimeError("Cloud Firestore is disconnected in live mode.")
        return count

notification_repo = NotificationRepository()

