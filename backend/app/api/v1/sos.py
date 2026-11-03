from fastapi import APIRouter, Depends, status
from typing import List
from app.schemas.sos import SosResponse, SosCreateRequest, SosActionRequest
from app.services.sos_service import sos_service
from app.core.dependencies import get_current_user_id

router = APIRouter(prefix="/sos", tags=["SOS & Emergency Support"])

@router.get("", response_model=List[SosResponse])
def get_sos_events(current_user: str = Depends(get_current_user_id)):
    """
    List past emergency and urgent alert events.
    """
    return sos_service.list_events()

@router.post("", response_model=SosResponse, status_code=status.HTTP_201_CREATED)
def trigger_sos(payload: SosCreateRequest, current_user: str = Depends(get_current_user_id)):
    """
    Trigger emergency alert with immediate consent validation and 112 simulation.
    """
    return sos_service.trigger_sos(payload.model_dump())

@router.get("/{event_id}", response_model=SosResponse)
def get_sos_details(event_id: str, current_user: str = Depends(get_current_user_id)):
    """
    Get status of an SOS event.
    """
    return sos_service.get_event(event_id)

@router.post("/{event_id}/acknowledge", response_model=SosResponse)
def acknowledge_sos(event_id: str, payload: SosActionRequest = None, current_user: str = Depends(get_current_user_id)):
    """
    Acknowledge emergency alert receipt.
    """
    notes = payload.notes if payload else None
    return sos_service.acknowledge_sos(event_id, notes=notes)

@router.post("/{event_id}/escalate", response_model=SosResponse)
def escalate_sos(event_id: str, payload: SosActionRequest = None, current_user: str = Depends(get_current_user_id)):
    """
    Escalate alert level (Level 1 ASHA -> Level 2 ANM/PHC -> Level 3 Ambulance 108/112).
    """
    notes = payload.notes if payload else None
    return sos_service.escalate_sos(event_id, notes=notes)

