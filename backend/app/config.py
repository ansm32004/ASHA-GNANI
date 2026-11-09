from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import List, Optional
import os

INSECURE_JWT_DEFAULTS = {
    "sahayika_super_secret_jwt_key_for_development_mode_only",
    "your-secret-key-here",
    "secret",
    "changeme",
    "default_secret",
    "admin",
    "password",
    "jwt_secret",
}

class Settings(BaseSettings):
    PROJECT_NAME: str = "SAHAYIKA - ASHA Digital Companion API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Demo Mode
    DEMO_MODE: bool = True

    # Firebase
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_SERVICE_ACCOUNT_JSON: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = "asha-997cd"
    FIREBASE_STORAGE_BUCKET: Optional[str] = "asha-997cd.firebasestorage.app"

    # Gnani AI Service Keys
    GNANI_API_KEY: Optional[str] = None
    GNANI_API_ENDPOINT: str = "https://api.vachana.ai"
    GNANI_PRISMA_ENDPOINT: str = "https://api.vachana.ai/stt/v3"
    GNANI_EVON_ENDPOINT: str = "https://api.vachana.ai/v1/evon/nlu"
    GNANI_TIMBRE_ENDPOINT: str = "https://api.vachana.ai/api/v1/tts/inference"

    # Gemini AI Configuration
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    # Network, Hosting & Public Origin Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8008
    PUBLIC_BASE_URL: Optional[str] = None
    BACKEND_PUBLIC_URL: Optional[str] = None

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    @model_validator(mode="after")
    def validate_security_settings(self):
        env = (self.ENVIRONMENT or "").strip().lower()
        secret = (self.SECRET_KEY or "").strip()

        if env == "production":
            if not secret:
                raise ValueError(
                    "CRITICAL PRODUCTION SECURITY ERROR: SECRET_KEY is missing. "
                    "In production, SECRET_KEY must be loaded from environment or backend/.env and cannot be empty."
                )
            if secret in INSECURE_JWT_DEFAULTS or len(secret) < 32:
                raise ValueError(
                    "CRITICAL PRODUCTION SECURITY ERROR: Insecure or weak SECRET_KEY detected. "
                    "Production requires a cryptographically secure key of at least 32 characters."
                )
        elif not secret:
            raise ValueError(
                "SECRET_KEY is not configured in backend/.env. "
                "Please configure a local SECRET_KEY in backend/.env to run the application."
            )
        return self

    model_config = {
        "env_file": [
            str(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")),
            str(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")),
            ".env"
        ],
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore"
    }

settings = Settings()
