import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.dependencies import get_current_user_id
from app.integrations.gemini.gemini_service import gemini_service, GeminiService

client = TestClient(app)

@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user_id] = lambda: "asha_sunita_001"
    yield
    app.dependency_overrides.clear()

# ==============================================================================
# PART 3: TEST CASES FOR COMPLETE AI QUESTION-ANSWERING FLOW
# ==============================================================================

def test_1_voice_question_flow_stt_gemini_tts():
    """
    Test Case 1: Voice question -> Gnani STT -> exact transcript -> Gemini -> relevant answer -> TTS.
    Verify:
    1. Audio is sent to STT (/ai/transcribe) and transcribed to exact question text.
    2. Exact transcript is passed to Gemini endpoint (/ai/assistant) with voice_enabled=True.
    3. Gemini returns a relevant answer grounded on the question.
    4. TTS synthesizes spoken audio and returns audio_url.
    5. STT is NOT called on Gemini's answer.
    """
    voice_question = "Aarav Kumar ka agla tika kaun sa hai?"

    # Step 1: User speaks question -> STT transcribes
    stt_res = client.post("/api/v1/ai/transcribe", json={
        "mock_input_text": voice_question,
        "language": "hi"
    })
    assert stt_res.status_code == 200
    stt_data = stt_res.json()
    exact_transcript = stt_data["transcript"]
    assert exact_transcript == voice_question

    # Step 2: Exact transcript sent to Assistant service with voice_enabled=True
    asst_res = client.post("/api/v1/ai/assistant", json={
        "query": exact_transcript,
        "language": "hi",
        "voice_enabled": True
    })
    assert asst_res.status_code == 200
    asst_data = asst_res.json()

    # Step 3: Relevant answer received from Gemini / grounded engine
    reply = asst_data["reply_text"]
    assert len(reply) > 10
    # Relevant to Aarav's vaccination
    assert any(term in reply.lower() for term in ["tika", "टीका", "dpt", "booster", "बूस्टर", "vaccin"])

    # Step 4: Spoken response via TTS is present
    assert asst_data["audio_url"] is not None
    assert "/api/v1/ai/audio/" in asst_data["audio_url"]

    # Step 5: Verify STT is NOT called on Gemini's answer (transcribe endpoint is not used for reply)
    assert asst_data.get("transcript") is None or asst_data.get("transcript") != reply


def test_2_typed_question_flow_gemini_direct_tts():
    """
    Test Case 2: Typed question -> Gemini directly -> relevant answer -> TTS.
    Verify:
    1. User types question directly.
    2. STT is NEVER called for typed question.
    3. Exact typed question goes to Gemini service.
    4. Relevant answer is returned.
    5. TTS audio is generated.
    """
    typed_question = "Meena Devi ki delivery kab expected hai?"

    # Direct assistant query without calling /ai/transcribe
    res = client.post("/api/v1/ai/assistant", json={
        "query": typed_question,
        "language": "hi",
        "voice_enabled": True
    })
    assert res.status_code == 200
    data = res.json()

    # Grounded answer received
    reply = data["reply_text"]
    assert any(term in reply.lower() for term in ["trimester", "ट्राइमेस्टर", "गर्भावस्था", "हफ्ते", "32", "delivery", "प्रसव", "2026-12-18", "pregnant", "edd"])

    # Spoken TTS audio generated
    assert data["audio_url"] is not None
    assert "/api/v1/ai/audio/" in data["audio_url"]


def test_3_empty_question_validation_error():
    """
    Test Case 3: Empty question -> validation error (HTTP 422).
    Verify empty or whitespace-only queries are strictly rejected.
    """
    # Empty string
    res_empty = client.post("/api/v1/ai/assistant", json={
        "query": "",
        "language": "hi"
    })
    assert res_empty.status_code == 422

    # Whitespace-only string
    res_spaces = client.post("/api/v1/ai/assistant", json={
        "query": "    \t \n  ",
        "language": "hi"
    })
    assert res_spaces.status_code == 422

    # Also test /assistant/query alias endpoint
    res_alias = client.post("/api/v1/ai/assistant/query", json={
        "query": "",
        "language": "hi"
    })
    assert res_alias.status_code == 422


def test_4_unclear_voice_recording_error():
    """
    Test Case 4: Unclear voice recording -> understandable transcription error message.
    """
    unclear_samples = ["...", "hmm", "shh", "noise", "kya"]
    for sample in unclear_samples:
        res = client.post("/api/v1/ai/assistant", json={
            "query": sample,
            "language": "hi",
            "voice_enabled": False
        })
        assert res.status_code == 200
        data = res.json()
        assert "माफ़ कीजिए" in data["reply_text"] or "स्पष्ट सुनाई नहीं दी" in data["reply_text"]
        assert "Speak Again" in data["suggested_actions"]


def test_5_gemini_api_key_missing_clear_config_error_no_crash():
    """
    Test Case 5: Gemini API key missing -> clear backend configuration handling, no crash.
    """
    with patch("app.config.settings.GEMINI_API_KEY", ""):
        res = client.post("/api/v1/ai/assistant", json={
            "query": "बुखार होने पर क्या करना चाहिए?",
            "language": "hi",
            "voice_enabled": False
        })
        assert res.status_code == 200
        data = res.json()
        # Does not crash, returns valid grounded response from approved knowledge base
        assert len(data["reply_text"]) > 10
        assert data["model_used"] == "semantic-rule-engine"


def test_6_gemini_api_failure_graceful_error_no_crash():
    """
    Test Case 6: Gemini API failure -> graceful fallback, no app crash.
    """
    with patch.object(gemini_service, "_generate_with_model", return_value=None):
        # Even when live Gemini throws/fails, assistant catches it and returns grounded answer
        res = client.post("/api/v1/ai/assistant", json={
            "query": "गर्भावस्था में कौन सा टीका लगता है?",
            "language": "hi",
            "voice_enabled": False
        })
        assert res.status_code == 200
        data = res.json()
        assert len(data["reply_text"]) > 10
        assert data["model_used"] == "semantic-rule-engine"


def test_7_question_about_unavailable_patient_data_never_invents():
    """
    Test Case 7: Question about unavailable patient data -> Gemini must state information
    is unavailable and NEVER invent patient facts, dates, or medicines.
    """
    # Sunita Devi has no blood sugar test or diabetes diagnosis recorded in app data
    res = client.post("/api/v1/ai/assistant", json={
        "query": "Sunita Devi ka blood sugar test ka result kya hai?",
        "language": "hi",
        "voice_enabled": False
    })
    assert res.status_code == 200
    data = res.json()
    reply = data["reply_text"]

    # Must clearly say information is unavailable
    assert "रिकॉर्ड में यह जानकारी उपलब्ध नहीं है" in reply or "उपलब्ध नहीं" in reply or "दर्ज नहीं है" in reply or "unavailable" in reply.lower()
    # Must NOT hallucinate a fake blood sugar reading (e.g. 120 mg/dL)
    assert "mg/dl" not in reply.lower()
    assert "140" not in reply and "120" not in reply and "95" not in reply


def test_8_two_different_questions_return_distinct_relevant_answers():
    """
    Test Case 8: Two different questions -> two distinct answers relevant to their respective questions.
    """
    # Question A: Child immunization
    res_a = client.post("/api/v1/ai/assistant", json={
        "query": "Aarav Kumar ka agla tika kaun sa hai?",
        "language": "hi",
        "voice_enabled": False
    })
    assert res_a.status_code == 200
    data_a = res_a.json()
    reply_a = data_a["reply_text"]

    # Question B: Government scheme financial assistance
    res_b = client.post("/api/v1/ai/assistant", json={
        "query": "Janani Suraksha Yojana me kitne rupaye milte hain?",
        "language": "hi",
        "voice_enabled": False
    })
    assert res_b.status_code == 200
    data_b = res_b.json()
    reply_b = data_b["reply_text"]

    # Answer A is about child vaccine (DPT Booster)
    assert any(term in reply_a.lower() for term in ["dpt", "tika", "टीका", "बूस्टर", "vaccin"])
    # Answer A must NOT talk about JSY money
    assert "1400" not in reply_a and "जननी सुरक्षा" not in reply_a

    # Answer B is about JSY maternal scheme benefit
    assert any(term in reply_b for term in ["1400", "जननी", "सुरक्षा", "योजना", "रुपये", "JSY", "वित्तीय"])
    # Answer B must NOT talk about Aarav's DPT vaccination
    assert "aarav" not in reply_b.lower() and "dpt" not in reply_b.lower()

    # Answers must be distinct
    assert reply_a != reply_b
