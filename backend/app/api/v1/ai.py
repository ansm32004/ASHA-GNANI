import os
import base64
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse
from typing import Optional
from app.schemas.ai import (
    TranscribeRequest, TranscribeResponse,
    AssistantQueryRequest, AssistantQueryResponse,
    ExtractVisitRequest, ExtractVisitResponse,
    SpeakRequest, SpeakResponse
)
from app.schemas.extraction import ExtractionRequest, ExtractionResponse
from app.integrations.gnani.prisma import prisma_stt
from app.integrations.gnani.timbre import timbre_tts, CACHE_DIR
from app.integrations.gemini.gemini_service import gemini_service
from app.services.assistant_service import assistant_service
from app.services.auth_service import auth_service
from app.core.dependencies import get_current_user_id

router = APIRouter(prefix="/ai", tags=["Gnani & Gemini AI Integration"])

@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    request: Request,
    current_user: str = Depends(get_current_user_id)
):
    """
    Transcribe spoken voice input to text via Gnani Prisma STT (v3.0).
    Supports both JSON body (with audio_base64) and multipart/form-data (with audio_file).
    """
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        form = await request.form()
        audio_file = form.get("audio_file") or form.get("file")
        language = form.get("language", "hi")
        mock_text = form.get("mock_input_text")

        if mock_text:
            return TranscribeResponse(
                transcript=str(mock_text).strip(),
                detected_language=str(language),
                confidence=0.98,
                duration_seconds=5.0,
                source="mock_input_text"
            )

        if not audio_file:
            raise HTTPException(status_code=400, detail="No audio file provided in multipart form.")

        # Read file and validate size (maximum 15MB)
        contents = await audio_file.read()
        if len(contents) > 15 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Audio file exceeds maximum 15MB limit.")

        filename = getattr(audio_file, "filename", "audio.wav")
        ext = os.path.splitext(filename)[1].lower()
        if ext and ext not in [".wav", ".m4a", ".mp3", ".ogg", ".webm", ".aac"]:
            raise HTTPException(status_code=400, detail=f"Unsupported audio format '{ext}'.")

        b64 = base64.b64encode(contents).decode("utf-8")
        res = await prisma_stt.transcribe(
            audio_base64=b64,
            language=str(language),
            filename=filename,
            content_type=getattr(audio_file, "content_type", None)
        )
        return TranscribeResponse(**res)

    else:
        # Standard JSON body
        body = await request.json()
        payload = TranscribeRequest(**body)
        res = await prisma_stt.transcribe(
            audio_base64=payload.audio_base64,
            language=payload.language or "hi",
            mock_input_text=payload.mock_input_text,
            audio_format=payload.audio_format
        )
        return TranscribeResponse(**res)

@router.post("/extract", response_model=ExtractionResponse)
async def extract_structured_fields_endpoint(
    payload: ExtractionRequest,
    current_user: str = Depends(get_current_user_id)
):
    """
    Extract structured task fields using Google Gemini API (with semantic fallback).
    Supports task types: visit_logging, household_registration, pregnancy_tracking, child_health, follow_up_task, community_request.
    """
    fields = await gemini_service.extract_structured_fields(
        transcript=payload.transcript,
        task_type=payload.task_type,
        household_id=payload.household_id,
        language=payload.language or "hi"
    )

    missing = [k for k, v in fields.items() if v is None or v == [] or v == {}]

    return ExtractionResponse(
        task_type=payload.task_type,
        extracted_fields=fields,
        confidence_score=0.95,
        raw_transcript=payload.transcript,
        requires_user_confirmation=True,
        missing_fields=missing,
        model_used=gemini_service.model_name if gemini_service.is_configured else "semantic-rule-engine"
    )

@router.post("/extract-visit", response_model=ExtractVisitResponse)
async def extract_visit_fields(
    payload: ExtractVisitRequest,
    current_user: str = Depends(get_current_user_id)
):
    """
    Extract structured clinical/operational field visit entities from natural speech narrative.
    """
    extracted = await gemini_service.extract_structured_fields(
        transcript=payload.transcript,
        task_type="visit_logging",
        household_id=payload.household_id,
        language=payload.language or "hi"
    )
    return ExtractVisitResponse(
        extracted_fields=extracted,
        confidence_score=0.95,
        raw_transcript=payload.transcript,
        requires_user_confirmation=True
    )

@router.post("/assistant", response_model=AssistantQueryResponse)
async def query_voice_assistant(
    payload: AssistantQueryRequest,
    current_user: str = Depends(get_current_user_id)
):
    """
    Query the SAHAYIKA AI voice assistant for schedule, households, or approved health program information.
    Uses multi-level safety checks and approved Firestore knowledge base retrieval.
    Persists audit interaction into 'ai_conversations' in Firestore.
    """
    profile = auth_service.get_current_user_profile(current_user)
    user_role = profile.get("role", "ASHA")
    user_hh = profile.get("household_id")
    res = await assistant_service.answer_query(
        query=payload.query,
        language=payload.language or "hi",
        voice_enabled=payload.voice_enabled or False,
        user_role=user_role,
        user_id=current_user,
        household_id=user_hh
    )
    return AssistantQueryResponse(**res)

@router.post("/speak", response_model=SpeakResponse)
async def text_to_speech(
    payload: Optional[SpeakRequest] = None,
    text: Optional[str] = Query(None),
    language: Optional[str] = Query("hi"),
    current_user: str = Depends(get_current_user_id)
):
    """
    Synthesize natural Indian speech for text output via Gnani Timbre TTS (v3.0).
    Accepts either JSON payload or query parameters. Returns base64 data URI and cache filename.
    """
    input_text = (payload.text if payload and payload.text else text) or ""
    input_lang = (payload.language if payload and payload.language else language) or "hi"
    input_voice = (payload.voice if payload and payload.voice else None)
    input_gender = (payload.voice_gender if payload and payload.voice_gender else "female")
    
    res = await timbre_tts.speak(
        text=input_text,
        language=input_lang,
        voice_gender=input_gender,
        voice=input_voice
    )
    return SpeakResponse(**res)

@router.get("/audio/{filename}")
async def get_audio_file(filename: str):
    """
    Stream or download synthesized speech WAV files.
    """
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(CACHE_DIR, safe_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(file_path, media_type="audio/wav", filename=safe_filename)
