import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.dependencies import get_current_user_id
from app.integrations.gemini.gemini_service import GeminiService, devanagari_to_latin
from app.services.assistant_service import assistant_service

client = TestClient(app)

# ==============================================================================
# PHASE 2: GEMINI MODEL CONFIGURATION & RESILIENCY TESTS
# ==============================================================================

def test_gemini_valid_model_configuration():
    """Test GeminiService initializes with configured or default model."""
    svc = GeminiService()
    assert svc.model_name in ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b", "gemini-3.5-flash"]
    candidates = svc._get_candidate_models()
    assert svc.model_name in candidates
    assert "gemini-1.5-flash" in candidates

def test_gemini_missing_api_key_fallback():
    """When API key is empty or missing, service safely falls back without crashing."""
    with patch("app.config.settings.GEMINI_API_KEY", ""):
        svc = GeminiService()
        assert not svc.is_configured
        
        # Dependency override to bypass auth for internal testing
        app.dependency_overrides[get_current_user_id] = lambda: "asha_001"
        try:
            res = client.post("/api/v1/ai/extract", json={
                "transcript": "आज मीना देवी के घर गई थी। बीपी 120/80 सामान्य रहा।",
                "task_type": "visit_logging",
                "language": "hi"
            })
            assert res.status_code == 200
            data = res.json()
            assert data["model_used"] == "semantic-rule-engine"
            assert data["extracted_fields"]["beneficiary_name"] == "Meena Devi"
        finally:
            app.dependency_overrides.clear()

def test_gemini_invalid_model_fallback():
    """When an invalid model name is provided, candidate fallback prevents crashes."""
    svc = GeminiService()
    svc.model_name = "invalid-model-name-999"
    candidates = svc._get_candidate_models()
    assert candidates[0] == "invalid-model-name-999"
    assert "gemini-1.5-flash" in candidates

@pytest.mark.asyncio
async def test_gemini_mocked_live_success():
    """When live Gemini API succeeds, model_used reports the live model."""
    svc = GeminiService()
    svc._client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = '{"beneficiary_name": "Sita Verma", "activity_category": "Maternal Health"}'
    svc._client.models.generate_content.return_value = mock_resp
    
    extracted = await svc.extract_structured_fields(
        transcript="सीता वर्मा का चेकअप",
        task_type="visit_logging",
        language="hi"
    )
    assert extracted["beneficiary_name"] == "Sita Verma"
    assert svc.last_used_model == svc.model_name

@pytest.mark.asyncio
async def test_gemini_api_failure_fallback():
    """When live Gemini API raises rate limit / network error, fallback succeeds seamlessly."""
    svc = GeminiService()
    svc._client = MagicMock()
    svc._client.models.generate_content.side_effect = RuntimeError("ResourceExhausted: 429 Rate limit exceeded")
    
    extracted = await svc.extract_structured_fields(
        transcript="रेखा शर्मा का वजन 55 किलो",
        task_type="visit_logging",
        language="hi"
    )
    assert extracted["beneficiary_name"] == "Rekha Sharma"
    assert svc.last_used_model == "semantic-rule-engine"

# ==============================================================================
# PHASE 4: HINDI INTENT DETECTION & NAME EXTRACTION TESTS
# ==============================================================================

def test_intent_devanagari_today_schedule():
    """Devanagari query 'आज मुझे किन घरों में जाना है?' must route to schedule, not clinical Q&A."""
    app.dependency_overrides[get_current_user_id] = lambda: "asha_sunita_001"
    try:
        res = client.post("/api/v1/ai/assistant", json={
            "query": "आज मुझे किन घरों में जाना है?",
            "language": "hi",
            "voice_enabled": False
        })
        assert res.status_code == 200
        data = res.json()
        assert "विजिट" in data["reply_text"] or "कार्य" in data["reply_text"] or "लंबित" in data["reply_text"]
        assert "दस्त" not in data["reply_text"]
    finally:
        app.dependency_overrides.clear()

def test_intent_devanagari_aaj_ka_kaam():
    """Devanagari query 'आज का क्या काम है?' must route to operational schedule."""
    app.dependency_overrides[get_current_user_id] = lambda: "asha_sunita_001"
    try:
        res = client.post("/api/v1/ai/assistant", json={
            "query": "आज का क्या काम है?",
            "language": "hi",
            "voice_enabled": False
        })
        assert res.status_code == 200
        data = res.json()
        assert "विजिट" in data["reply_text"] or "कार्य" in data["reply_text"] or "लंबित" in data["reply_text"]
    finally:
        app.dependency_overrides.clear()

def test_intent_hinglish_query():
    """Hinglish query 'aaj kin gharon me jaana hai' must route to operational status."""
    app.dependency_overrides[get_current_user_id] = lambda: "asha_sunita_001"
    try:
        res = client.post("/api/v1/ai/assistant", json={
            "query": "aaj kin gharon me jaana hai",
            "language": "hi",
            "voice_enabled": False
        })
        assert res.status_code == 200
        data = res.json()
        assert "विजिट" in data["reply_text"] or "कार्य" in data["reply_text"]
    finally:
        app.dependency_overrides.clear()

def test_intent_english_query():
    """English query 'what are my visits today' must route to today's schedule."""
    app.dependency_overrides[get_current_user_id] = lambda: "asha_sunita_001"
    try:
        res = client.post("/api/v1/ai/assistant", json={
            "query": "what are my visits today",
            "language": "en",
            "voice_enabled": False
        })
        assert res.status_code == 200
        data = res.json()
        assert "visit" in data["reply_text"].lower() or "scheduled" in data["reply_text"].lower()
    finally:
        app.dependency_overrides.clear()

def test_intent_mixed_language_query():
    """Mixed language query 'Aaj ka field visit schedule kya hai?' must route to schedule."""
    app.dependency_overrides[get_current_user_id] = lambda: "asha_sunita_001"
    try:
        res = client.post("/api/v1/ai/assistant", json={
            "query": "Aaj ka field visit schedule kya hai?",
            "language": "hi",
            "voice_enabled": False
        })
        assert res.status_code == 200
        data = res.json()
        assert "विजिट" in data["reply_text"] or "कार्य" in data["reply_text"]
    finally:
        app.dependency_overrides.clear()

def test_name_extraction_unknown_indian_names():
    """Verify dynamic extraction and transliteration of Indian names not in predefined list."""
    app.dependency_overrides[get_current_user_id] = lambda: "asha_001"
    try:
        # Test 1: Ramesh Yadav
        res1 = client.post("/api/v1/ai/extract", json={
            "transcript": "रमेश यादव का घर, रामपुर कलां। परिवार में 5 सदस्य हैं।",
            "task_type": "household_registration",
            "language": "hi"
        })
        assert res1.status_code == 200
        fields1 = res1.json()["extracted_fields"]
        assert "Ramesh Yadav" in fields1["household_head_name"]
        assert fields1["member_count"] == 5

        # Test 2: Anita Devi
        res2 = client.post("/api/v1/ai/extract", json={
            "transcript": "अनिता देवी का चेकअप किया।",
            "task_type": "visit_logging",
            "language": "hi"
        })
        assert res2.status_code == 200
        fields2 = res2.json()["extracted_fields"]
        assert "Anita Devi" in fields2["beneficiary_name"]
    finally:
        app.dependency_overrides.clear()

def test_name_extraction_multi_word_names():
    """Verify multi-word Indian names (e.g. Suresh Kumar)."""
    app.dependency_overrides[get_current_user_id] = lambda: "asha_001"
    try:
        res = client.post("/api/v1/ai/extract", json={
            "transcript": "सुरेश कुमार का परिवार, 6 सदस्य हैं।",
            "task_type": "household_registration",
            "language": "hi"
        })
        assert res.status_code == 200
        fields = res.json()["extracted_fields"]
        assert "Suresh Kumar" in fields["household_head_name"]
        assert fields["member_count"] == 6
    finally:
        app.dependency_overrides.clear()

def test_name_extraction_no_name_present():
    """Ensure ordinary clinical/operational terms are not extracted as person names."""
    app.dependency_overrides[get_current_user_id] = lambda: "asha_001"
    try:
        res = client.post("/api/v1/ai/extract", json={
            "transcript": "आज अस्पताल में टीकाकरण का काम हुआ। कोई नया परिवार नहीं मिला।",
            "task_type": "household_registration",
            "language": "hi"
        })
        assert res.status_code == 200
        fields = res.json()["extracted_fields"]
        assert fields["household_head_name"] is None
    finally:
        app.dependency_overrides.clear()

def test_devanagari_to_latin_transliteration_helper():
    """Unit test for phonetic transliterator."""
    assert devanagari_to_latin("राजेश") == "Rajesh"
    assert devanagari_to_latin("कुमार") == "Kumar"
    assert devanagari_to_latin("मीना") == "Meena"
    assert devanagari_to_latin("देवी") == "Devi"
    assert "Anil" in devanagari_to_latin("अनिल")
