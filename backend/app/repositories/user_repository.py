from typing import Dict, Any, Optional, List
from app.config import settings
try:
    from google.cloud.firestore_v1 import FieldFilter
except ImportError:
    FieldFilter = None
from app.integrations.firebase.firestore_repository import FirestoreRepository
from app.repositories.mock_data import DEMO_ASHA_USER, DEMO_COMMUNITY_USER
from app.core.security import get_password_hash
from app.core.logging import logger

class UserRepository:
    """
    Repository for user profile and authentication records stored in Cloud Firestore,
    with local in-memory mock fallback in demo mode.
    """
    def __init__(self):
        self._firestore = FirestoreRepository("users")
        self._initialized = False
        self._mock_users: Dict[str, Dict[str, Any]] = {
            "asha_sunita_001": {
                **DEMO_ASHA_USER,
                "email": "asha.demo@sahayika.test",
                "role": "ASHA",
                "password_hash": get_password_hash("Sahayika@123"),
            },
            "comm_meena_001": {
                **DEMO_COMMUNITY_USER,
                "email": "community.demo@sahayika.test",
                "role": "COMMUNITY",
                "password_hash": get_password_hash("Sahayika@123"),
            },
        }

    @property
    def is_connected(self) -> bool:
        return self._firestore.is_connected

    def _ensure_initialized(self):
        if not self._firestore.is_connected or self._initialized:
            return
        try:
            self._initialize_default_users_if_missing()
            self._initialized = True
        except Exception as e:
            logger.warning(f"UserRepository initialization warning: {e}")

    def _initialize_default_users_if_missing(self):
        coll = self._firestore._get_collection()
        if coll is None:
            return

        demo_defaults = [
            (
                "asha_sunita_001",
                "asha.demo@sahayika.test",
                {
                    **DEMO_ASHA_USER,
                    "email": "asha.demo@sahayika.test",
                    "role": "ASHA",
                    "password_hash": get_password_hash("Sahayika@123"),
                }
            ),
            (
                "comm_meena_001",
                "community.demo@sahayika.test",
                {
                    **DEMO_COMMUNITY_USER,
                    "email": "community.demo@sahayika.test",
                    "role": "COMMUNITY",
                    "password_hash": get_password_hash("Sahayika@123"),
                }
            ),
        ]

        for doc_id, email, user_data in demo_defaults:
            try:
                # 1. Check if doc exists by ID
                doc_ref = coll.document(doc_id)
                doc_snap = doc_ref.get()
                if doc_snap.exists:
                    continue

                # 2. Check if user with email already exists
                existing_docs = list(coll.where(filter=FieldFilter("email", "==", email)).limit(1).stream())
                if existing_docs:
                    continue

                # 3. Create only missing record
                doc_ref.set(user_data)
                logger.info(f"Initialized user record for '{email}' in Firestore 'users' collection.")
            except Exception as err:
                logger.warning(f"Could not initialize demo user '{email}': {err}")

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        self._ensure_initialized()
        clean_email = email.strip().lower()
        if not self._firestore.is_connected:
            if not getattr(settings, "DEMO_MODE", False):
                raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot fetch user.")
            for u in self._mock_users.values():
                if u.get("email", "").lower() == clean_email:
                    return u
            return None
        coll = self._firestore._get_collection()
        if coll is None:
            return None
        try:
            docs = list(coll.where(filter=FieldFilter("email", "==", clean_email)).limit(1).stream())
            if docs:
                data = docs[0].to_dict() or {}
                if "id" not in data:
                    data["id"] = docs[0].id
                return data
            return None
        except Exception as e:
            logger.error(f"Error fetching user by email '{clean_email}': {e}")
            raise

    def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_initialized()
        if not self._firestore.is_connected:
            if not getattr(settings, "DEMO_MODE", False):
                raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot fetch user.")
            return self._mock_users.get(user_id)
        return self._firestore.get(user_id)

    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        self._ensure_initialized()
        user_id = str(user_data.get("id"))
        if not self._firestore.is_connected:
            if not getattr(settings, "DEMO_MODE", False):
                raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot create user.")
            self._mock_users[user_id] = user_data
            return user_data
        self._firestore.set(user_id, user_data, merge=False)
        return user_data

user_repository = UserRepository()

