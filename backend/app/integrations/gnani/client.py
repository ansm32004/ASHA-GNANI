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
        # Dynamically check settings in case of runtime update or reload
        key = self.api_key or settings.GNANI_API_KEY
        return bool(key and key.strip())

    def get_api_key(self) -> str:
        return (self.api_key or settings.GNANI_API_KEY or "").strip()

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
        endpoint_or_url: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Call Gnani Prisma STT multipart form endpoint.
        """
        if not self.is_configured:
            logger.info("Gnani API key not configured for STT.")
            return None

        url = endpoint_or_url or settings.GNANI_PRISMA_ENDPOINT
        if not url.startswith("http"):
            url = f"{self.base_url.rstrip('/')}/{url.lstrip('/')}"

        files = {
            "audio_file": (filename, audio_bytes, content_type)
        }
        data = {
            "model": model,
            "language_code": language_code,
            "format": "transcribe"
        }
        # Multipart form requests should not set explicit Content-Type; httpx sets boundary automatically
        headers = {
            "X-API-Key-ID": self.get_api_key(),
            "Authorization": f"Bearer {self.get_api_key()}",
            "User-Agent": "Mozilla/5.0 (Linux; Android 10) SAHAYIKA/1.0"
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, data=data, files=files, headers=headers)
                if response.status_code >= 400:
                    logger.error(f"Error calling Gnani Prisma STT at {url}: {response.status_code} - {response.text}")
                    return None
                return response.json()
            except Exception as e:
                logger.error(f"Error calling Gnani Prisma STT at {url}: {e}")
                return None

gnani_client = GnaniClient()
