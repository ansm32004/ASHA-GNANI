import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.dependencies import get_current_user_id

client = TestClient(app)

def test_ai_transcribe_mock():
    # Helper to bypass auth for testing endpoint logic directly
    app.dependency_overrides[get_current_user_id] = lambda: "asha_001"
    try:
        res = client.post("/api/v1/ai/transcribe", json={
            "mock_input_text": "आज मीना देवी का फॉलो-अप पूरा किया।",
            "language": "hi"
        })
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["transcript"] == "आज मीना देवी का फॉलो-अप पूरा किया।"
        assert data["detected_language"] == "hi"
    finally:
        app.dependency_overrides.clear()

def test_ai_extract_visit():
    app.dependency_overrides[get_current_user_id] = lambda: "asha_001"
    try:
        res = client.post("/api/v1/ai/extract-visit", json={
            "transcript": "आज मीना देवी के घर गई थी। 32वें हफ्ते का चेकअप किया। बीपी 118/76 सामान्य रहा।",
            "household_id": "hh_001",
            "language": "hi"
        })
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["extracted_fields"]["household_id"] == "hh_001"
        assert "Meena Devi" in data["extracted_fields"]["beneficiary_name"]
        assert data["requires_user_confirmation"] is True
    finally:
        app.dependency_overrides.clear()

def test_ai_assistant_query():
    app.dependency_overrides[get_current_user_id] = lambda: "asha_001"
    try:
        res = client.post("/api/v1/ai/assistant", json={
            "query": "मुझे आज किन घरों में जाना है?",
            "language": "hi",
            "voice_enabled": False
        })
        assert res.status_code == 200, res.text
        data = res.json()
        assert "सुनीता जी" in data["reply_text"] or "विजिट" in data["reply_text"]
        assert len(data["suggested_actions"]) > 0
    finally:
        app.dependency_overrides.clear()

def test_ai_speak_tts():
    app.dependency_overrides[get_current_user_id] = lambda: "asha_001"
    try:
        res = client.post("/api/v1/ai/speak", json={
            "text": "नमस्ते आशा दीदी",
            "language": "hi",
            "voice": "Shivani"
        })
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["text"] == "नमस्ते आशा दीदी"
        assert data["language"] == "hi"
        assert data["voice"] == "Shivani"
        # If Gnani live network is accessible, audio_url has data:audio/wav;base64,...
        if not data["is_simulated"]:
            assert data["audio_url"].startswith("/api/v1/ai/audio/") or data["audio_url"].startswith("http")
            assert (data.get("audio_content") or data["audio_url"]).startswith("data:audio/wav;base64,")
            assert data["cache_file"] is not None
            # Also test GET /audio/{filename}
            audio_get = client.get(f"/api/v1/ai/audio/{data['cache_file']}")
            assert audio_get.status_code == 200
            assert audio_get.headers["content-type"] == "audio/wav"
    finally:
        app.dependency_overrides.clear()

def test_ai_live_end_to_end_voice_roundtrip():
    """
    Synthesize speech via Timbre -> Transcribe audio via Prisma -> Verify text match!
    """
    app.dependency_overrides[get_current_user_id] = lambda: "asha_001"
    try:
        speak_res = client.post("/api/v1/ai/speak", json={
            "text": "मीना देवी का टीकाकरण अगले हफ्ते है",
            "language": "hi",
            "voice": "Shivani"
        })
        assert speak_res.status_code == 200
        speak_data = speak_res.json()
        if not speak_data["is_simulated"]:
            audio_source = speak_data.get("audio_content") or speak_data["audio_url"]
            raw_b64 = audio_source.split(",", 1)[1] if "," in audio_source else audio_source
            transcribe_res = client.post("/api/v1/ai/transcribe", json={
                "audio_base64": raw_b64,
                "language": "hi"
            })
            assert transcribe_res.status_code == 200
            t_data = transcribe_res.json()
            assert t_data["source"] == "gnani_prisma_live"
            assert "मीना" in t_data["transcript"] or "टीका" in t_data["transcript"]
    finally:
        app.dependency_overrides.clear()
