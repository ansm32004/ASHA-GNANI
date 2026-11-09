from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any

class TranscribeRequest(BaseModel):
    audio_base64: Optional[str] = None
    audio_format: Optional[str] = "wav"
    language: Optional[str] = "hi"
    mock_input_text: Optional[str] = None  # for easy testing/demo simulation

class TranscribeResponse(BaseModel):
    transcript: str
    detected_language: str
    confidence: float
    duration_seconds: float
    source: Optional[str] = None
    error: Optional[str] = None

class AssistantQueryRequest(BaseModel):
    query: str
    conversation_history: Optional[List[Dict[str, str]]] = []
    language: Optional[str] = "hi"
    voice_enabled: Optional[bool] = False

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Question cannot be empty. Please provide a valid question.")
        return v.strip()

class AssistantQueryResponse(BaseModel):
    reply_text: str
    audio_url: Optional[str] = None
    suggested_actions: List[str] = []
    referenced_households: List[Dict[str, Any]] = []
    referenced_tasks: List[Dict[str, Any]] = []
    model_used: Optional[str] = None
    safety_disclaimer: str = "SAHAYIKA AI Assistant provides operational guidance and approved government scheme information. It never diagnoses diseases or prescribes treatment. Always consult MO/ANM for medical emergencies."

class ExtractVisitRequest(BaseModel):
    transcript: str
    household_id: Optional[str] = None
    language: Optional[str] = "hi"

class ExtractVisitResponse(BaseModel):
    extracted_fields: Dict[str, Any]
    confidence_score: float
    raw_transcript: str
    requires_user_confirmation: bool = True

class SpeakRequest(BaseModel):
    text: Optional[str] = None
    language: Optional[str] = "hi"
    voice: Optional[str] = "Shivani"
    voice_gender: Optional[str] = "female"

class SpeakResponse(BaseModel):
    audio_url: Optional[str] = None
    audio_content: Optional[str] = None
    cache_file: Optional[str] = None
    text: str
    language: str
    voice: str
    duration_seconds: Optional[float] = None
    is_simulated: bool = False


