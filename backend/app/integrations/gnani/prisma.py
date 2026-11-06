import base64
import subprocess
import shutil
from typing import Optional, Dict, Any
from app.integrations.gnani.client import gnani_client
from app.core.logging import logger

class PrismaSTTService:
    """
    Gnani Prisma Speech-to-Text (ASR v3.0) service adapter.
    Converts audio streams or base64 audio into accurate Devanagari Hindi or English transcripts.
    Supports auto-normalization to 16kHz mono WAV for high-compatibility across mobile and web.
    """
    def __init__(self):
        self.client = gnani_client

    def _convert_to_pcm_wav(self, audio_bytes: bytes) -> Optional[bytes]:
        """
        Normalize any audio container (WebM, AAC, AMR, corrupted headers, high sample rates)
        to clean 16kHz mono 16-bit PCM WAV via ffmpeg.
        """
        if not shutil.which("ffmpeg"):
            return None
        try:
            p = subprocess.Popen(
                ["ffmpeg", "-y", "-i", "pipe:0", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "-f", "wav", "pipe:1"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            wav_out, _ = p.communicate(input=audio_bytes, timeout=8)
            if p.returncode == 0 and len(wav_out) > 44:
                return wav_out
        except Exception as e:
            logger.warning(f"ffmpeg audio normalization error: {e}")
        return None

    def _normalize_lang_code(self, lang: Optional[str]) -> str:
        if not lang:
            return "hi-IN"
        l = lang.strip().lower()
        if "-" in l:
            parts = l.split("-")
            return f"{parts[0]}-{parts[1].upper()}"
        mapping = {
            "hi": "hi-IN",
            "en": "en-IN",
            "mr": "mr-IN",
            "ta": "ta-IN",
            "te": "te-IN",
            "bn": "bn-IN",
            "gu": "gu-IN",
            "kn": "kn-IN",
            "ml": "ml-IN",
            "pa": "pa-IN",
            "or": "or-IN"
        }
        return mapping.get(l, "hi-IN")

    def _detect_audio_type(
        self,
        data: bytes,
        hint_format: Optional[str] = None,
        hint_filename: Optional[str] = None
    ):
        ext_hint = (hint_format or "").strip().lower()
        if not ext_hint and hint_filename:
            parts = hint_filename.split(".")
            if len(parts) > 1:
                ext_hint = parts[-1].lower()

        if ext_hint in ["m4a", "mp4"]:
            return "audio.m4a", "audio/mp4"
        if ext_hint in ["wav", "wave"]:
            return "audio.wav", "audio/wav"
        if ext_hint in ["aac"]:
            return "audio.aac", "audio/aac"
        if ext_hint in ["mp3"]:
            return "audio.mp3", "audio/mpeg"
        if ext_hint in ["ogg", "opus"]:
            return "audio.ogg", "audio/ogg"

        # Check binary headers
        if len(data) > 12 and data[:4] == b"RIFF" and data[8:12] == b"WAVE":
            return "audio.wav", "audio/wav"
        if len(data) > 8 and (b"ftyp" in data[:64] or b"moov" in data[:64] or b"mdat" in data[:64]):
            return "audio.m4a", "audio/mp4"
        if len(data) > 2 and (data[:3] == b"ID3" or (data[0] == 0xFF and (data[1] & 0xE0) == 0xE0)):
            return "audio.mp3", "audio/mpeg"
        if len(data) > 2 and data[0] == 0xFF and (data[1] & 0xF0) == 0xF0:
            return "audio.aac", "audio/aac"
        if len(data) > 4 and data[:4] == b"OggS":
            return "audio.ogg", "audio/ogg"
        if len(data) > 4 and data[:4] == b"\x1a\x45\xdf\xa3":
            return "audio.webm", "audio/webm"

        # Fallback default
        return "audio.wav", "audio/wav"

    async def transcribe(
        self,
        audio_base64: Optional[str] = None,
        language: str = "hi",
        mock_input_text: Optional[str] = None,
        audio_format: Optional[str] = None,
        filename: Optional[str] = None,
        content_type: Optional[str] = None
    ) -> Dict[str, Any]:
        if mock_input_text and mock_input_text.strip():
            return {
                "transcript": mock_input_text.strip(),
                "detected_language": language,
                "confidence": 0.98,
                "duration_seconds": 6.4,
                "source": "mock_input_text"
            }

        if self.client.is_configured and audio_base64:
            try:
                # Strip potential data URL prefix
                raw_b64 = audio_base64
                if "," in raw_b64:
                    raw_b64 = raw_b64.split(",", 1)[1]
                
                audio_bytes = base64.b64decode(raw_b64)
                if len(audio_bytes) > 0:
                    detected_filename, mime = self._detect_audio_type(
                        audio_bytes,
                        hint_format=audio_format,
                        hint_filename=filename
                    )
                    if content_type:
                        mime = content_type
                    if filename:
                        detected_filename = filename

                    lang_code = self._normalize_lang_code(language)
                    
                    # WebM is not supported directly by Prisma v3; normalize to WAV
                    if mime in ["audio/webm", "video/webm"] or detected_filename.endswith(".webm"):
                        converted = self._convert_to_pcm_wav(audio_bytes)
                        if converted:
                            audio_bytes = converted
                            detected_filename = "audio.wav"
                            mime = "audio/wav"

                    res = await self.client.post_stt(
                        audio_bytes=audio_bytes,
                        filename=detected_filename,
                        content_type=mime,
                        model="prisma-v3.0",
                        language_code=lang_code
                    )

                    # If first attempt was unsuccessful and we did not already convert to WAV, auto-normalize to WAV and retry
                    if (not res or not res.get("success")) and mime != "audio/wav":
                        logger.info(f"Gnani Prisma STT failed with {mime}. Retrying with ffmpeg 16kHz mono WAV normalization...")
                        converted = self._convert_to_pcm_wav(audio_bytes)
                        if converted:
                            res = await self.client.post_stt(
                                audio_bytes=converted,
                                filename="audio.wav",
                                content_type="audio/wav",
                                model="prisma-v3.0",
                                language_code=lang_code
                            )

                    if res and res.get("success"):
                        transcript = (res.get("transcript") or "").strip()
                        logger.info(f"Gnani Prisma STT transcribed: '{transcript}'")
                        return {
                            "transcript": transcript,
                            "detected_language": res.get("detected_language_code", lang_code),
                            "confidence": 0.98 if transcript else 0.0,
                            "duration_seconds": round(res.get("processing_time", 0.0), 2),
                            "source": "gnani_prisma_live"
                        }
                    else:
                        logger.warning(f"Gnani Prisma STT returned unsuccessful response: {res}")
            except Exception as e:
                logger.error(f"Error during Gnani Prisma transcription: {e}")

        # If audio was provided but could not be transcribed, do not fabricate fake transcripts
        if audio_base64:
            return {
                "transcript": "",
                "detected_language": language or "hi",
                "confidence": 0.0,
                "duration_seconds": 0.0,
                "source": "gnani_prisma_failed"
            }

        return {
            "transcript": "",
            "detected_language": language or "hi",
            "confidence": 0.0,
            "duration_seconds": 0.0,
            "source": "empty_input"
        }

prisma_stt = PrismaSTTService()
