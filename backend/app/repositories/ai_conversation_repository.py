import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.integrations.firebase.firestore_repository import FirestoreRepository
from app.config import settings
from app.core.logging import logger

class AIConversationRepository:
    """
    Repository for AI interactions, health queries, voice consultations,
    and voice-to-form audit logs in Cloud Firestore ('ai_conversations').
    """
    def __init__(self):
        self._firestore = FirestoreRepository("ai_conversations")
        self._conversations: List[Dict[str, Any]] = []

    @property
    def is_connected(self) -> bool:
        return self._firestore.is_connected

    def log_interaction(
        self,
        query: str,
        response_text: str,
        user_id: Optional[str] = None,
        household_id: Optional[str] = None,
        language: str = "hi",
        task_type: str = "assistant_query",
        safety_level: str = "Level 1 Grounded",
        audio_url: Optional[str] = None,
        extracted_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        conv_id = f"conv_{uuid.uuid4().hex[:10]}"
        now_iso = datetime.now().isoformat() + "Z"

        record = {
            "id": conv_id,
            "user_id": user_id or "anonymous",
            "household_id": household_id,
            "query": query,
            "response_text": response_text,
            "language": language,
            "task_type": task_type,
            "safety_level": safety_level,
            "audio_url": audio_url,
            "extracted_data": extracted_data or {},
            "created_at": now_iso
        }

        if self._firestore.is_connected:
            try:
                self._firestore.set(conv_id, record)
            except Exception as e:
                logger.error(f"Failed to log AI conversation to Firestore: {e}")
                if not settings.DEMO_MODE:
                    raise

        self._conversations.insert(0, record)
        return record

    def list_user_conversations(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        if self._firestore.is_connected:
            try:
                return self._firestore.list_all(filters=[("user_id", "==", user_id)], limit=limit)
            except Exception as e:
                logger.warning(f"Error fetching conversations from Firestore: {e}")
                if not settings.DEMO_MODE:
                    raise

        return [c for c in self._conversations if c.get("user_id") == user_id][:limit]

ai_conversation_repo = AIConversationRepository()

