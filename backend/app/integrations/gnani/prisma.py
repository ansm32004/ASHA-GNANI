import base64
import os
import subprocess
import shutil
import tempfile
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

    def _is_valid_16k_pcm_wav(self, data: bytes) -> bool:
        """
        Check if audio bytes already represent a clean 16kHz mono 16-bit PCM WAV.
        """
        if len(data) < 44 or data[:4] != b"RIFF" or data[8:12] != b"WAVE":
            return False
        fmt_idx = data.find(b"fmt ")
        if fmt_idx == -1 or fmt_idx + 24 > len(data):
            return False
        audio_format = int.from_bytes(data[fmt_idx+8:fmt_idx+10], "little")
        num_channels = int.from_bytes(data[fmt_idx+10:fmt_idx+12], "little")
        sample_rate = int.from_bytes(data[fmt_idx+12:fmt_idx+16], "little")
        bits_per_sample = int.from_bytes(data[fmt_idx+22:fmt_idx+24], "little")
        return audio_format == 1 and num_channels == 1 and sample_rate == 16000 and bits_per_sample == 16

    def _convert_to_pcm_wav(self, audio_bytes: bytes, input_ext: str = "bin") -> Optional[bytes]:
        """
        Normalize any audio container (WebM, AAC, M4A, MP3, AMR, corrupted headers, high sample rates)
        to clean 16kHz mono 16-bit PCM WAV via ffmpeg.
        Uses temporary files to guarantee seekable RIFF/WAVE header creation without 0xFFFFFFFF stream placeholders.
        """
        if not shutil.which("ffmpeg"):
            return None
        in_file = None
        out_file = None
        try:
            in_file = tempfile.NamedTemporaryFile(suffix=f".{input_ext}", delete=False)
            in_file.write(audio_bytes)
            in_file.flush()
            in_file.close()

            out_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            out_file.close()

            cmd = [
                "ffmpeg", "-y",
                "-i", in_file.name,
                "-ar", "16000",
                "-ac", "1",
                "-c:a", "pcm_s16le",
                "-f", "wav",
                out_file.name
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=12)
            if res.returncode == 0 and os.path.exists(out_file.name) and os.path.getsize(out_file.name) > 44:
                with open(out_file.name, "rb") as f:
                    wav_data = f.read()
                return wav_data
            else:
                err_msg = res.stderr.decode("utf-8", errors="ignore")[-300:] if res.stderr else "unknown error"
                logger.warning(f"ffmpeg conversion failed: {err_msg}")
        except Exception as e:
            logger.warning(f"ffmpeg audio normalization error: {e}")
        finally:
            if in_file and os.path.exists(in_file.name):
                try: os.unlink(in_file.name)
                except Exception: pass
            if out_file and os.path.exists(out_file.name):
                try: os.unlink(out_file.name)
                except Exception: pass
        return None

    def _normalize_lang_code(self, lang: Optional[str]) -> str:
        if not lang:
            return "hi-IN"
        l = lang.strip().lower()
        if l in ["hinglish", "hi-en", "en-hi"]:
            return "hi-IN,en-IN"
        if l in ["auto", "indic-auto", "all"]:
            return "indic-auto"
        if l in ["hindi", "hi"]:
            return "hi-IN"
        if l in ["english", "en"]:
            return "en-IN"
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
        # 1. Primary check: Binary container signatures take precedence over hints
        if len(data) > 4 and data[:4] == b"\x1a\x45\xdf\xa3":
            return "audio.webm", "audio/webm"
        if len(data) > 12 and data[:4] == b"RIFF" and data[8:12] == b"WAVE":
            return "audio.wav", "audio/wav"
        if len(data) > 8 and (b"ftyp" in data[:64] or b"moov" in data[:64] or b"mdat" in data[:64]):
            return "audio.m4a", "audio/m4a"
        if len(data) > 2 and (data[:3] == b"ID3" or (data[0] == 0xFF and (data[1] & 0xE0) == 0xE0)):
            return "audio.mp3", "audio/mpeg"
        if len(data) > 2 and data[0] == 0xFF and (data[1] & 0xF0) == 0xF0:
            return "audio.aac", "audio/aac"
        if len(data) > 4 and data[:4] == b"OggS":
            return "audio.ogg", "audio/ogg"

        # 2. Secondary check: Extension / Format hints
        ext_hint = (hint_format or "").strip().lower()
        if not ext_hint and hint_filename:
            parts = hint_filename.split(".")
            if len(parts) > 1:
                ext_hint = parts[-1].lower()

        if ext_hint in ["webm"]:
            return "audio.webm", "audio/webm"
        if ext_hint in ["m4a", "mp4"]:
            return "audio.m4a", "audio/m4a"
        if ext_hint in ["wav", "wave"]:
            return "audio.wav", "audio/wav"
        if ext_hint in ["aac"]:
            return "audio.aac", "audio/aac"
        if ext_hint in ["mp3"]:
            return "audio.mp3", "audio/mpeg"
        if ext_hint in ["ogg", "opus"]:
            return "audio.ogg", "audio/ogg"

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
                "source": "mock_input_text",
                "error": None
            }

        if not audio_base64 or not audio_base64.strip():
            return {
                "transcript": "",
                "detected_language": language or "hi",
                "confidence": 0.0,
                "duration_seconds": 0.0,
                "source": "empty_input",
                "error": "No audio data provided."
            }

        if not self.client.is_configured:
            logger.warning("Gnani Prisma STT called but GNANI_API_KEY is not configured.")
            return {
                "transcript": "",
                "detected_language": language or "hi",
                "confidence": 0.0,
                "duration_seconds": 0.0,
                "source": "gnani_not_configured",
                "error": "Gnani API key is not configured. Please set GNANI_API_KEY in backend/.env"
            }

        try:
            # Strip potential data URL prefix
            raw_b64 = audio_base64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[1]
            
            audio_bytes = base64.b64decode(raw_b64)
            if len(audio_bytes) < 32:
                return {
                    "transcript": "",
                    "detected_language": language or "hi",
                    "confidence": 0.0,
                    "duration_seconds": 0.0,
                    "source": "empty_input",
                    "error": "Audio recording is too short or empty."
                }

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
            format_type = "code-mix" if ("hi-IN,en-IN" in lang_code or lang_code == "indic-auto") else "transcribe"
            
            # Universal Normalization: Ensure audio sent to Gnani Prisma STT is 100% clean 16kHz mono WAV
            input_ext = "webm" if "webm" in mime or detected_filename.endswith(".webm") else ("m4a" if "m4a" in mime or detected_filename.endswith(".m4a") else "bin")
            if not self._is_valid_16k_pcm_wav(audio_bytes) and shutil.which("ffmpeg"):
                logger.info(f"Normalizing {mime} audio ({len(audio_bytes)} bytes) to 16kHz mono WAV via ffmpeg...")
                converted = self._convert_to_pcm_wav(audio_bytes, input_ext=input_ext)
                if converted:
                    audio_bytes = converted
                    detected_filename = "audio.wav"
                    mime = "audio/wav"
                    logger.info(f"Audio normalized successfully ({len(audio_bytes)} bytes WAV).")

            res = await self.client.post_stt(
                audio_bytes=audio_bytes,
                filename=detected_filename,
                content_type=mime,
                model="prisma-v3.0",
                language_code=lang_code,
                format_type=format_type
            )

            # If first attempt was unsuccessful and we did not already convert to WAV, retry with WAV normalization
            if (not res or not res.get("success")) and mime != "audio/wav" and shutil.which("ffmpeg"):
                logger.info(f"Gnani Prisma STT returned unsuccessful with {mime}. Retrying with 16kHz mono WAV normalization...")
                converted = self._convert_to_pcm_wav(audio_bytes, input_ext=input_ext)
                if converted:
                    res = await self.client.post_stt(
                        audio_bytes=converted,
                        filename="audio.wav",
                        content_type="audio/wav",
                        model="prisma-v3.0",
                        language_code=lang_code,
                        format_type=format_type
                    )

            if res and res.get("success"):
                transcript = (res.get("transcript") or "").strip()
                logger.info(f"Gnani Prisma STT transcribed: '{transcript}'")
                return {
                    "transcript": transcript,
                    "detected_language": res.get("detected_language_code", lang_code),
                    "confidence": 0.98 if transcript else 0.0,
                    "duration_seconds": round(res.get("processing_time", 0.0), 2),
                    "source": "gnani_prisma_live",
                    "error": None
                }
            else:
                err_msg = (res.get("error_message") if isinstance(res, dict) else None) or "Gnani STT was unable to transcribe the audio."
                logger.warning(f"Gnani Prisma STT returned unsuccessful response: {res}")
                return {
                    "transcript": "",
                    "detected_language": language or "hi",
                    "confidence": 0.0,
                    "duration_seconds": 0.0,
                    "source": "gnani_prisma_failed",
                    "error": err_msg
                }
        except Exception as e:
            logger.error(f"Error during Gnani Prisma transcription: {e}")
            return {
                "transcript": "",
                "detected_language": language or "hi",
                "confidence": 0.0,
                "duration_seconds": 0.0,
                "source": "gnani_prisma_failed",
                "error": f"Audio processing error: {str(e)}"
            }

prisma_stt = PrismaSTTService()
