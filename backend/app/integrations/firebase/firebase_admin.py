import os
from typing import Optional
from app.config import settings
from app.core.logging import logger

class FirebaseManager:
    def __init__(self):
        self._app = None
        self._firestore_db = None
        self._initialized = False

    def initialize(self):
        if self._initialized:
            return self._app

        cred_path = settings.FIREBASE_CREDENTIALS_PATH
        resolved_cred = None
        if cred_path:
            from pathlib import Path
            backend_dir = Path(__file__).resolve().parents[3]
            candidates = [
                Path(cred_path),
                backend_dir / cred_path,
                backend_dir / "secrets" / "firebase-service-account.json",
            ]
            for p in candidates:
                if p.is_file():
                    resolved_cred = str(p)
                    break

        if resolved_cred:
            try:
                import firebase_admin
                from firebase_admin import credentials, firestore
                cred = credentials.Certificate(resolved_cred)
                self._app = firebase_admin.initialize_app(cred, {
                    'projectId': settings.FIREBASE_PROJECT_ID,
                    'storageBucket': settings.FIREBASE_STORAGE_BUCKET
                })
                self._firestore_db = firestore.client()
                self._initialized = True
                logger.info("Firebase Admin SDK initialized successfully with credentials.")
            except Exception as e:
                logger.warning(f"Could not initialize Firebase Admin SDK: {e}. Running in local mock mode.")
        else:
            logger.info("No Firebase credentials provided. Backend running in standard mock/demo database mode.")

        return self._app

    @property
    def is_connected(self) -> bool:
        return self._initialized and self._firestore_db is not None

    def get_firestore(self):
        return self._firestore_db

firebase_manager = FirebaseManager()

