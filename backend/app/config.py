from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "SAHAYIKA - ASHA Digital Companion API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "sahayika_super_secret_jwt_key_for_development_mode_only"
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
    GEMINI_MODEL: str = "gemini-3.5-flash"

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    model_config = {
        "env_file": [
            ".env",
            str(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
        ],
        "case_sensitive": True,
        "extra": "ignore"
    }

settings = Settings()
