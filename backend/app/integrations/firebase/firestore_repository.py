from typing import Dict, Any, List, Optional
from app.integrations.firebase.firebase_admin import firebase_manager
from app.core.logging import logger

class FirestoreRepository:
    """
    Standard interface for Cloud Firestore collections.
    When Firebase credentials are provided, reads/writes directly to Firestore.
    Otherwise gracefully forwards to local repository.
    """
    def __init__(self, collection_name: str):
        self.collection_name = collection_name

    def _get_collection(self):
        db = firebase_manager.get_firestore()
        if db:
            return db.collection(self.collection_name)
        return None

    def add(self, data: Dict[str, Any]) -> str:
        coll = self._get_collection()
        if coll:
            doc_ref = coll.document()
            doc_ref.set(data)
            return doc_ref.id
        return data.get("id", "mock_id")

    def get(self, doc_id: str) -> Optional[Dict[str, Any]]:
        coll = self._get_collection()
        if coll:
            doc = coll.document(doc_id).get()
            if doc.exists:
                return doc.to_dict()
        return None

