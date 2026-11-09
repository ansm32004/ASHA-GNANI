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
        results = self._notifications.copy()
        if user_id:
            results = [
                n for n in results
                if n.get("userId") is None
                or n.get("userId") == user_id
                or (isinstance(n.get("metadata"), dict) and n.get("metadata", {}).get("household_id") == user_id)
                or (user_id == "comm_meena_001" and n.get("userId") in ["hh_001", "comm_meena_001"])
            ]
        if category and category != "All":
            results = [n for n in results if n.get("category", "").lower() == category.lower()]
        if unread_only:
            results = [n for n in results if not n.get("is_read", False)]

        # Sort newest notifications first: "Just now" and latest created_at at the very top
        results.sort(
            key=lambda x: (
                1 if (x.get("timestamp") or "").lower() == "just now" else 0,
                x.get("created_at") or ""
            ),
            reverse=True
        )
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
            "action_type": data.get("action_type"),
            "action_id": data.get("action_id"),
            "metadata": data.get("metadata"),
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

