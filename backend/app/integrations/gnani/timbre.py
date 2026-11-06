import base64
import hashlib
import os
from typing import Optional, Dict, Any
from app.integrations.gnani.client import gnani_client
from app.core.logging import logger

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "static", "audio")
os.makedirs(CACHE_DIR, exist_ok=True)

class TimbreTTSService:
    """
    Gnani Timbre Text-to-Speech service (v3.0).
    Generates natural, expressive Indian voice output for ASHA worker query replies.
    """
    def __init__(self):
        self.client = gnani_client

    async def speak(
        self,
        text: str,
        language: str = "hi",
        voice_gender: str = "female",
        voice: Optional[str] = None
    ) -> Dict[str, Any]:
        clean_text = (text or "").strip()
        if not clean_text:
            return {
                "audio_url": None,
                "text": "",
                "language": language,
                "voice": voice or "Shivani",
                "is_simulated": True
            }

        # Select natural voice based on gender or explicit choice
        selected_voice = voice
        if not selected_voice:
            if voice_gender.lower() == "male":
                selected_voice = "Avinash"
            else:
                # Female Hindi natural voice
                selected_voice = "Shivani"

        # Check local audio cache first before making remote network call
        hash_key = hashlib.md5(f"{clean_text}_{selected_voice}".encode("utf-8")).hexdigest()
        cache_filename = f"{hash_key}.wav"
        cache_path = os.path.join(CACHE_DIR, cache_filename)

        if os.path.exists(cache_path) and os.path.getsize(cache_path) > 44:
            try:
                with open(cache_path, "rb") as f:
                    audio_bytes = f.read()
                b64_str = base64.b64encode(audio_bytes).decode("utf-8")
                data_uri = f"data:audio/wav;base64,{b64_str}"
                duration_sec = round(len(audio_bytes) / 96000.0, 2)
                direct_url = f"http://192.168.0.7:8008/api/v1/ai/audio/{cache_filename}"
                logger.info(f"Gnani Timbre TTS instant cache hit: {cache_filename} ({duration_sec}s)")
                return {
                    "audio_url": direct_url,
                    "audio_content": data_uri,
                    "cache_file": cache_filename,
                    "text": clean_text,
                    "language": language,
                    "voice": selected_voice,
                    "duration_seconds": duration_sec,
                    "is_simulated": False
                }
            except Exception as read_err:
                logger.warning(f"Could not read cached audio: {read_err}")

        if self.client.is_configured:
            payload = {
                "text": clean_text,
                "voice": selected_voice,
                "model": "timbre-v3.0",
                "audio_config": {
                    "encoding": "linear_pcm",
                    "container": "wav"
                }
            }

            try:
                audio_bytes = await self.client.post_tts(payload)
                if audio_bytes and len(audio_bytes) > 44:  # Valid WAV with data
                    with open(cache_path, "wb") as f:
                        f.write(audio_bytes)

                    # Encode to data URI for zero-latency mobile playback
                    b64_str = base64.b64encode(audio_bytes).decode("utf-8")
                    data_uri = f"data:audio/wav;base64,{b64_str}"
                    duration_sec = round(len(audio_bytes) / 96000.0, 2)
                    direct_url = f"http://192.168.0.7:8008/api/v1/ai/audio/{cache_filename}"

                    logger.info(f"Gnani Timbre TTS synthesized {len(audio_bytes)} bytes ({duration_sec}s) for voice '{selected_voice}'")
                    return {
                        "audio_url": direct_url,
                        "audio_content": data_uri,
                        "cache_file": cache_filename,
                        "text": clean_text,
                        "language": language,
                        "voice": selected_voice,
                        "duration_seconds": duration_sec,
                        "is_simulated": False
                    }
                else:
                    logger.warning("Gnani Timbre TTS returned empty or invalid audio; falling back to simulated response.")
            except Exception as e:
                logger.error(f"Gnani Timbre TTS error: {e}")

        # Fallback simulation response
        return {
            "audio_url": None,
            "text": clean_text,
            "language": language,
            "voice": selected_voice or f"timbre_{language}_{voice_gender}_standard",
            "is_simulated": True
        }

timbre_tts = TimbreTTSService()
