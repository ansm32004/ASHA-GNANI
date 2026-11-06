import os
import httpx
from typing import Optional, Dict, Any
from app.config import settings
from app.core.logging import logger

class GnaniClient:
    """
    Client for Gnani AI Vachana platform APIs (Prisma STT, Timbre TTS, Evon NLU).
    Uses official headers: X-API-Key-ID and Authorization Bearer.
    """
    def __init__(self):
        self.api_key = settings.GNANI_API_KEY
        self.base_url = settings.GNANI_API_ENDPOINT
        self.timeout = 20.0

    @property
    def is_configured(self) -> bool:
        return bool(self.get_api_key())

    def get_api_key(self) -> str:
        key = self.api_key or settings.GNANI_API_KEY or os.environ.get("GNANI_API_KEY")
        if not key:
            # Check backend/.env directly so edits take effect immediately without requiring restart
            env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
            if os.path.exists(env_path):
                try:
                    with open(env_path, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("GNANI_API_KEY="):
                                val = line.split("=", 1)[1].strip().strip('"').strip("'")
                                if val:
                                    key = val
                                    break
                except Exception:
                    pass
        return (key or "").strip()

    def get_auth_headers(self, content_type: Optional[str] = "application/json") -> Dict[str, str]:
        key = self.get_api_key()
        headers = {
            "X-API-Key-ID": key,
            "Authorization": f"Bearer {key}",
            "User-Agent": "Mozilla/5.0 (Linux; Android 10) SAHAYIKA/1.0"
        }
        if content_type:
            headers["Content-Type"] = content_type
        return headers

    async def post(self, endpoint_or_url: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Generic JSON POST request.
        """
        if not self.is_configured:
            logger.info(f"Gnani API key not configured. Using fallback for {endpoint_or_url}")
            return None

        url = endpoint_or_url if endpoint_or_url.startswith("http") else f"{self.base_url.rstrip('/')}/{endpoint_or_url.lstrip('/')}"
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, json=payload, headers=self.get_auth_headers("application/json"))
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error calling Gnani API endpoint {url}: {e}")
                return None

    async def post_tts(self, payload: Dict[str, Any], endpoint_or_url: Optional[str] = None) -> Optional[bytes]:
        """
        Call Gnani Timbre TTS endpoint and return raw WAV audio bytes.
        """
        if not self.is_configured:
            logger.info("Gnani API key not configured for TTS.")
            return None

        url = endpoint_or_url or settings.GNANI_TIMBRE_ENDPOINT
        if not url.startswith("http"):
            url = f"{self.base_url.rstrip('/')}/{url.lstrip('/')}"

        headers = self.get_auth_headers("application/json")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return response.content
            except Exception as e:
                logger.error(f"Error calling Gnani Timbre TTS at {url}: {e}")
                return None

    async def post_stt(
        self,
        audio_bytes: bytes,
        filename: str = "audio.wav",
        content_type: str = "audio/wav",
        model: str = "prisma-v3.0",
        language_code: str = "hi-IN",
        format_type: str = "transcribe",
        endpoint_or_url: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Call Gnani Prisma STT multipart form endpoint (v3.0).
        Uses official X-API-Key-ID authentication.
        """
        if not self.is_configured:
            logger.info("Gnani API key not configured for STT.")
            return {
                "success": False,
                "error_code": "NOT_CONFIGURED",
                "error_message": "Gnani API key is not configured. Please set GNANI_API_KEY in backend/.env"
            }

        url = endpoint_or_url or settings.GNANI_PRISMA_ENDPOINT
        if not url.startswith("http"):
            url = f"{self.base_url.rstrip('/')}/{url.lstrip('/')}"

        files = {
            "audio_file": (filename, audio_bytes, content_type)
        }
        data = {
            "model": model,
            "language_code": language_code,
            "format": format_type
        }
        headers = {
            "X-API-Key-ID": self.get_api_key(),
            "User-Agent": "Mozilla/5.0 (Linux; Android 10) SAHAYIKA/1.0"
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, data=data, files=files, headers=headers)
                if response.status_code >= 400:
                    err_msg = response.text
                    err_code = f"HTTP_{response.status_code}"
                    try:
                        err_json = response.json()
                        detail = err_json.get("detail", {})
                        if isinstance(detail, dict):
                            err_code = detail.get("error_code", err_code)
                            err_msg = detail.get("message", err_msg)
                        elif isinstance(detail, str):
                            err_msg = detail
                    except Exception:
                        pass
                    logger.error(f"Error calling Gnani Prisma STT at {url}: {response.status_code} - {err_msg}")
                    return {
                        "success": False,
                        "error_code": err_code,
                        "error_message": err_msg,
                        "status_code": response.status_code
                    }
                return response.json()
            except httpx.TimeoutException:
                logger.error(f"Timeout calling Gnani Prisma STT at {url}")
                return {
                    "success": False,
                    "error_code": "TIMEOUT",
                    "error_message": "Request to Gnani STT API timed out. Please try again."
                }
            except Exception as e:
                logger.error(f"Network error calling Gnani Prisma STT at {url}: {e}")
                return {
                    "success": False,
                    "error_code": "NETWORK_ERROR",
                    "error_message": f"Could not reach Gnani STT API: {str(e)}"
                }

gnani_client = GnaniClient()
