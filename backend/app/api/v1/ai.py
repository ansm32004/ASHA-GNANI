from fastapi import APIRouter, Depends
from app.schemas.ai import (
    TranscribeRequest, TranscribeResponse,
    AssistantQueryRequest, AssistantQueryResponse,
    ExtractVisitRequest, ExtractVisitResponse
)
from app.integrations.gnani.prisma import prisma_stt
from app.integrations.gnani.evon import evon_nlu
from app.integrations.gnani.timbre import timbre_tts
from app.services.assistant_service import assistant_service
from app.core.dependencies import get_current_user_id

router = APIRouter(prefix="/ai", tags=["Gnani AI Integration"])

@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(payload: TranscribeRequest, current_user: str = Depends(get_current_user_id)):
    """
    Transcribe spoken ASHA voice input to text via Gnani Prisma STT (with Hindi Devanagari support).
    """
    res = await prisma_stt.transcribe(
        audio_base64=payload.audio_base64,
        language=payload.language or "hi",
        mock_input_text=payload.mock_input_text
    )
    return TranscribeResponse(**res)

@router.post("/assistant", response_model=AssistantQueryResponse)
async def query_voice_assistant(payload: AssistantQueryRequest, current_user: str = Depends(get_current_user_id)):
    """
    Query the SAHAYIKA AI voice assistant for schedule, households, or verified health program information.
    """
    res = await assistant_service.answer_query(
        query=payload.query,
        language=payload.language or "hi",
        voice_enabled=payload.voice_enabled or False
    )
    return AssistantQueryResponse(**res)

@router.post("/extract-visit", response_model=ExtractVisitResponse)
async def extract_visit_fields(payload: ExtractVisitRequest, current_user: str = Depends(get_current_user_id)):
    """
    Extract structured clinical/operational field visit entities from natural speech narrative using Gnani Evon NLU.
    """
    extracted = await evon_nlu.extract_visit(
        transcript=payload.transcript,
        household_id=payload.household_id,
        language=payload.language or "hi"
    )
    return ExtractVisitResponse(
        extracted_fields=extracted,
        confidence_score=extracted.get("confidence", 0.92),
        raw_transcript=payload.transcript,
        requires_user_confirmation=True
    )

@router.post("/speak")
async def text_to_speech(text: str, language: str = "hi", current_user: str = Depends(get_current_user_id)):
    """
    Synthesize natural Indian speech for text output via Gnani Timbre TTS.
    """
    return await timbre_tts.speak(text=text, language=language)

