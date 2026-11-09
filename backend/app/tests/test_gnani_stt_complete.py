import pytest
import io
import base64
from unittest.mock import AsyncMock, patch, PropertyMock
from fastapi.testclient import TestClient
import httpx

from app.main import app
from app.core.dependencies import get_current_user_id
from app.integrations.gnani.client import gnani_client, GnaniClient
from app.integrations.gnani.prisma import prisma_stt, PrismaSTTService
from app.config import settings

client = TestClient(app)

@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user_id] = lambda: "asha_test_worker"
    yield
    app.dependency_overrides.clear()

# Minimal valid 16kHz mono WAV header with 100 samples
VALID_WAV_HEADER = (
    b"RIFF\x24\x01\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x01\x00\x00"
    + (b"\x00\x00" * 128)
)

# 1. Correct Request Construction & Headers
@pytest.mark.asyncio
async def test_stt_request_construction_and_headers():
    test_client = GnaniClient()
    test_client.api_key = "DUMMY_TEST_KEY_NOT_REAL"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = httpx.Response(
            200,
            json={
                "success": True,
                "transcript": "नमस्ते आशा दीदी",
                "model": "prisma-v3.0",
                "detected_language_code": "hi-IN",
                "processing_time": 0.42
            },
            request=httpx.Request("POST", "https://api.vachana.ai/stt/v3")
        )

        res = await test_client.post_stt(
            audio_bytes=VALID_WAV_HEADER,
            filename="test.wav",
            content_type="audio/wav",
            model="prisma-v3.0",
            language_code="hi-IN",
            format_type="transcribe"
        )

        assert mock_post.called
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["data"]["model"] == "prisma-v3.0"
        assert call_kwargs["data"]["language_code"] == "hi-IN"
        assert call_kwargs["data"]["format"] == "transcribe"
        assert call_kwargs["headers"]["X-API-Key-ID"] == "DUMMY_TEST_KEY_NOT_REAL"
        assert "Authorization" not in call_kwargs["headers"]  # Official header only
        assert res["success"] is True
        assert res["transcript"] == "नमस्ते आशा दीदी"

# 2. Hinglish / Code-Mix Request Construction
@pytest.mark.asyncio
async def test_stt_hinglish_code_mix_request():
    test_client = GnaniClient()
    test_client.api_key = "test_key"

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = httpx.Response(
            200,
            json={
                "success": True,
                "transcript": "Aaj mujhe household visits complete karni hain",
                "model": "prisma-v3.0",
                "detected_language_code": "hi-IN",
                "processing_time": 0.55
            },
            request=httpx.Request("POST", "https://api.vachana.ai/stt/v3")
        )

        service = PrismaSTTService()
        service.client = test_client

        b64 = base64.b64encode(VALID_WAV_HEADER).decode("utf-8")
        res = await service.transcribe(audio_base64=b64, language="hinglish")

        assert mock_post.called
        call_data = mock_post.call_args.kwargs["data"]
        assert call_data["language_code"] == "hi-IN,en-IN"
        assert call_data["format"] == "code-mix"
        assert res["source"] == "gnani_prisma_live"
        assert "visits complete" in res["transcript"]

# 3. Successful Transcription Response via Endpoint
def test_transcribe_endpoint_success():
    with patch.object(GnaniClient, "is_configured", new_callable=PropertyMock, return_value=True):
        with patch.object(gnani_client, "post_stt", new_callable=AsyncMock) as mock_post_stt:
            mock_post_stt.return_value = {
                "success": True,
                "transcript": "आज मीना देवी का फॉलो-अप पूरा किया।",
                "detected_language_code": "hi-IN",
                "processing_time": 0.65
            }

            b64 = base64.b64encode(VALID_WAV_HEADER).decode("utf-8")
            res = client.post("/api/v1/ai/transcribe", json={
                "audio_base64": b64,
                "language": "hi",
                "audio_format": "wav"
            })
            assert res.status_code == 200
            data = res.json()
            assert data["transcript"] == "आज मीना देवी का फॉलो-अप पूरा किया।"
            assert data["detected_language"] == "hi-IN"
            assert data["confidence"] == 0.98
            assert data["source"] == "gnani_prisma_live"
            assert data["error"] is None

# 4. Empty Audio Response
def test_transcribe_empty_audio_handling():
    res = client.post("/api/v1/ai/transcribe", json={
        "audio_base64": "",
        "language": "hi"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["transcript"] == ""
    assert data["source"] == "empty_input"
    assert data["error"] is not None

# 5. Invalid Audio Format Rejection (Multipart)
def test_transcribe_invalid_format_multipart():
    dummy_pdf = io.BytesIO(b"%PDF-1.4 dummy malicious content")
    res = client.post(
        "/api/v1/ai/transcribe",
        files={"audio_file": ("test.pdf", dummy_pdf, "application/pdf")},
        data={"language": "hi"}
    )
    assert res.status_code == 400
    assert "Unsupported" in res.json()["detail"]

# 6. API Authentication Failure (401 from Gnani)
def test_transcribe_api_auth_failure():
    with patch.object(GnaniClient, "is_configured", new_callable=PropertyMock, return_value=True):
        with patch.object(gnani_client, "post_stt", new_callable=AsyncMock) as mock_post_stt:
            mock_post_stt.return_value = {
                "success": False,
                "error_code": "INVALID_API_KEY",
                "error_message": "Unauthorized: Invalid Gnani API Key",
                "status_code": 401
            }

            b64 = base64.b64encode(VALID_WAV_HEADER).decode("utf-8")
            res = client.post("/api/v1/ai/transcribe", json={
                "audio_base64": b64,
                "language": "hi"
            })
            assert res.status_code == 200
            data = res.json()
            assert data["transcript"] == ""
            assert data["source"] == "gnani_prisma_failed"
            assert "Invalid Gnani API Key" in data["error"]

# 7. API Timeout Handling
def test_transcribe_api_timeout():
    with patch.object(GnaniClient, "is_configured", new_callable=PropertyMock, return_value=True):
        with patch.object(gnani_client, "post_stt", new_callable=AsyncMock) as mock_post_stt:
            mock_post_stt.return_value = {
                "success": False,
                "error_code": "TIMEOUT",
                "error_message": "Request to Gnani STT API timed out. Please try again."
            }

            b64 = base64.b64encode(VALID_WAV_HEADER).decode("utf-8")
            res = client.post("/api/v1/ai/transcribe", json={
                "audio_base64": b64,
                "language": "hi"
            })
            assert res.status_code == 200
            data = res.json()
            assert data["transcript"] == ""
            assert "timed out" in data["error"]

# 8. Network Failure Handling
def test_transcribe_network_failure():
    with patch.object(GnaniClient, "is_configured", new_callable=PropertyMock, return_value=True):
        with patch.object(gnani_client, "post_stt", new_callable=AsyncMock) as mock_post_stt:
            mock_post_stt.return_value = {
                "success": False,
                "error_code": "NETWORK_ERROR",
                "error_message": "Could not reach Gnani STT API: Connection refused"
            }

            b64 = base64.b64encode(VALID_WAV_HEADER).decode("utf-8")
            res = client.post("/api/v1/ai/transcribe", json={
                "audio_base64": b64,
                "language": "hi"
            })
            assert res.status_code == 200
            data = res.json()
            assert data["transcript"] == ""
            assert "Could not reach Gnani STT API" in data["error"]

# 9. Not Configured Key Handling
def test_transcribe_not_configured_key():
    with patch.object(GnaniClient, "is_configured", new_callable=PropertyMock, return_value=False):
        b64 = base64.b64encode(VALID_WAV_HEADER).decode("utf-8")
        res = client.post("/api/v1/ai/transcribe", json={
            "audio_base64": b64,
            "language": "hi"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["source"] == "gnani_not_configured"
        assert "not configured" in data["error"]

# 10. Multiple Consecutive Transcription Sessions
def test_multiple_consecutive_transcription_sessions():
    with patch.object(GnaniClient, "is_configured", new_callable=PropertyMock, return_value=True):
        with patch.object(gnani_client, "post_stt", new_callable=AsyncMock) as mock_post_stt:
            phrases = [
                "पहला सत्र: आज सुनीता के घर जाना है।",
                "दूसरा सत्र: आरव का टीकाकरण पूरा हुआ।",
                "तीसरा सत्र: जननी सुरक्षा योजना का फॉर्म भरा।"
            ]

            for phrase in phrases:
                mock_post_stt.return_value = {
                    "success": True,
                    "transcript": phrase,
                    "detected_language_code": "hi-IN",
                    "processing_time": 0.4
                }
                b64 = base64.b64encode(VALID_WAV_HEADER).decode("utf-8")
                res = client.post("/api/v1/ai/transcribe", json={
                    "audio_base64": b64,
                    "language": "hi"
                })
                assert res.status_code == 200
                data = res.json()
                assert data["transcript"] == phrase
                assert data["source"] == "gnani_prisma_live"

# 11. Audio Type Detection
def test_audio_type_detection():
    service = PrismaSTTService()
    # WAV header detection
    fn, mime = service._detect_audio_type(VALID_WAV_HEADER)
    assert fn == "audio.wav"
    assert mime == "audio/wav"

    # M4A hint detection
    fn, mime = service._detect_audio_type(b"ftypM4A ....", hint_format="m4a")
    assert fn == "audio.m4a"
    assert mime == "audio/m4a"

    # MP3 hint detection
    fn, mime = service._detect_audio_type(b"ID3....", hint_filename="rec.mp3")
    assert fn == "audio.mp3"
    assert mime == "audio/mpeg"

# 12. Language Code Normalization
def test_language_normalization():
    service = PrismaSTTService()
    assert service._normalize_lang_code("hi") == "hi-IN"
    assert service._normalize_lang_code("en") == "en-IN"
    assert service._normalize_lang_code("hinglish") == "hi-IN,en-IN"
    assert service._normalize_lang_code("auto") == "indic-auto"
    assert service._normalize_lang_code("mr") == "mr-IN"
    assert service._normalize_lang_code("ta") == "ta-IN"

# 13. WebM Binary Magic Signature Takes Precedence Over Faulty Format Hint
def test_webm_magic_signature_detection():
    service = PrismaSTTService()
    # WebM starts with \x1a\x45\xdf\xa3
    webm_dummy = b"\x1a\x45\xdf\xa3\x9f\x42\x86\x81\x01\x42" + (b"\x00" * 30)
    # Even if hint says 'wav', binary check detects webm
    fn, mime = service._detect_audio_type(webm_dummy, hint_format="wav")
    assert fn == "audio.webm"
    assert mime == "audio/webm"

# 14. Audio Normalization to 16kHz Mono WAV
def test_audio_normalization_conversion():
    service = PrismaSTTService()
    # Check is_valid_16k_pcm_wav on valid header
    assert service._is_valid_16k_pcm_wav(VALID_WAV_HEADER) is True
    # Corrupted / non-wav returns False
    assert service._is_valid_16k_pcm_wav(b"\x1a\x45\xdf\xa3" + b"\x00"*40) is False

