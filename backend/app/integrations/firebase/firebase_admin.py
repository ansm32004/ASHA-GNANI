import os
import json
import base64
from pathlib import Path
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

        import firebase_admin
        from firebase_admin import credentials, firestore

        cred = None
        resolved_cred = None

        # 1. Check direct raw JSON or Base64 string in env
        json_env = (
            getattr(settings, "FIREBASE_SERVICE_ACCOUNT_JSON", None)
            or os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
            or os.environ.get("FIREBASE_CREDENTIALS_JSON")
        )
        if json_env and json_env.strip():
            try:
                raw_str = json_env.strip()
                if raw_str.startswith("{"):
                    cert_dict = json.loads(raw_str)
                else:
                    decoded = base64.b64decode(raw_str).decode("utf-8")
                    cert_dict = json.loads(decoded)
                cred = credentials.Certificate(cert_dict)
                logger.info("Loaded Firebase credentials directly from environment JSON string.")
            except Exception as e:
                logger.warning(f"Could not parse FIREBASE_SERVICE_ACCOUNT_JSON: {e}")

        # 2. Check path in settings or system environment
        if not cred:
            cred_path = (
                settings.FIREBASE_CREDENTIALS_PATH
                or os.environ.get("FIREBASE_CREDENTIALS_PATH")
                or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
            )
            backend_dir = Path(__file__).resolve().parents[3]
            cwd = Path.cwd()
            candidates = []
            if cred_path and cred_path.strip():
                clean_path = cred_path.strip()
                candidates.extend([
                    Path(clean_path),
                    backend_dir / clean_path,
                    cwd / clean_path,
                    cwd / "backend" / clean_path
                ])
            candidates.extend([
                backend_dir / "secrets" / "firebase-service-account.json",
                backend_dir / "serviceAccountKey.json",
                cwd / "secrets" / "firebase-service-account.json",
                cwd / "serviceAccountKey.json",
                cwd / "backend" / "secrets" / "firebase-service-account.json",
                cwd / "backend" / "serviceAccountKey.json",
            ])
            for p in candidates:
                if p.is_file():
                    resolved_cred = str(p)
                    break

            if resolved_cred:
                try:
                    cred = credentials.Certificate(resolved_cred)
                    logger.info(f"Loaded Firebase credentials from certificate file: {resolved_cred}")
                except Exception as e:
                    logger.warning(f"Could not load certificate from {resolved_cred}: {e}")

        # 3. Check if FIRESTORE_EMULATOR_HOST is set
        emulator_host = os.environ.get("FIRESTORE_EMULATOR_HOST")

        # 4. Initialize Firebase Admin SDK
        if cred or emulator_host:
            try:
                if not firebase_admin._apps:
                    self._app = firebase_admin.initialize_app(cred, {
                        'projectId': settings.FIREBASE_PROJECT_ID,
                        'storageBucket': settings.FIREBASE_STORAGE_BUCKET
                    })
                else:
                    self._app = firebase_admin.get_app()

                self._firestore_db = firestore.client()
                self._initialized = True
                logger.info(f"Firebase Admin SDK initialized successfully for project '{settings.FIREBASE_PROJECT_ID}'.")
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

