import httpx
from typing import Optional, Dict, Any
from app.config import settings
from app.core.logging import logger

class GnaniClient:
    def __init__(self):
        self.api_key = settings.GNANI_API_KEY
        self.base_url = settings.GNANI_API_ENDPOINT
        self.timeout = 15.0

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def post(self, endpoint: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not self.is_configured:
            logger.info(f"Gnani API key not configured. Using intelligent mock fallback for {endpoint}")
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Error calling Gnani API endpoint {url}: {e}")
                return None

gnani_client = GnaniClient()

