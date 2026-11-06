from typing import List, Optional, Dict, Any
from app.config import settings
from app.repositories.mock_data import generate_mock_sos_events
from app.integrations.firebase.firestore_repository import FirestoreRepository
from app.core.logging import logger
from datetime import datetime

class SosRepository:
    def __init__(self):
        self._firestore = FirestoreRepository("sos_events")
        self._events: List[Dict[str, Any]] = generate_mock_sos_events()
        self._initialized_db = False

    def _ensure_synced(self):
        if not self._firestore.is_connected:
            return
        if not self._initialized_db:
            try:
                self._firestore.seed_if_empty(self._events, id_key="id")
                remote_docs = self._firestore.list_all()
                if remote_docs:
                    self._events = remote_docs
                self._initialized_db = True
            except Exception as e:
                logger.warning(f"SosRepository sync warning: {e}")

    def list_all(self) -> List[Dict[str, Any]]:
        self._ensure_synced()
        if self._firestore.is_connected:
            try:
                remote_docs = self._firestore.list_all()
                if remote_docs:
                    self._events = remote_docs
            except Exception as e:
                logger.warning(f"Could not refresh SOS events from Firestore: {e}")

        results = self._events.copy()
        results.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return results

    def get_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_synced()
        if self._firestore.is_connected:
            try:
                doc = self._firestore.get(event_id)
                if doc:
                    return doc
            except Exception as e:
                logger.warning(f"Error fetching SOS event {event_id} from Firestore: {e}")

        for e in self._events:
            if e["id"] == event_id:
                return e
        return None

    def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        self._ensure_synced()
        is_immediate = data.get("emergency_type") == "Immediate Emergency"
        now_iso = datetime.now().isoformat() + "Z"

        # Find the highest existing numeric ID in format 'sos_XXX'
        max_num = 0
        for e in self._events:
            eid = str(e.get("id", ""))
            if eid.startswith("sos_"):
                try:
                    num = int(eid.split("_")[1])
                    if num > max_num:
                        max_num = num
                except (ValueError, IndexError):
                    pass

        next_num = max(len(self._events) + 1, max_num + 1)
        record = None

        from google.api_core.exceptions import AlreadyExists

        # Collision-safe creation loop with atomic create_doc
        for _ in range(20):
            candidate_id = f"sos_{next_num:03d}"
            # Check local in-memory cache first
            if any(e.get("id") == candidate_id for e in self._events):
                next_num += 1
                continue

            candidate_record = {
                "id": candidate_id,
                "household_id": data.get("household_id"),
                "household_name": data.get("household_name", "Household"),
                "beneficiary_name": data.get("beneficiary_name"),
                "emergency_type": data.get("emergency_type", "Immediate Emergency"),
                "description": data["description"],
                "status": "Triggered",
                "call_112_initiated": is_immediate,
                "asha_notified": True,
                "escalation_level": 3 if is_immediate else 1,
                "timestamp": now_iso,
                "resolved_at": None,
                "notes": "Emergency alert initiated. In simulation mode: emergency dispatch call 112 simulated, assigned ASHA alerted."
            }

            if self._firestore.is_connected:
                try:
                    self._firestore.create_doc(candidate_id, candidate_record)
                    record = candidate_record
                    break
                except AlreadyExists:
                    logger.warning(f"SOS ID collision detected for {candidate_id}, retrying with next ID")
                    next_num += 1
                    continue
                except Exception as e:
                    logger.error(f"Failed to persist SOS event to Firestore: {e}")
                    raise
            else:
                if not getattr(settings, "DEMO_MODE", False):
                    raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot trigger SOS event.")
                record = candidate_record
                break

        if not record:
            import uuid
            unique_id = f"sos_{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:4]}"
            record = {
                "id": unique_id,
                "household_id": data.get("household_id"),
                "household_name": data.get("household_name", "Household"),
                "beneficiary_name": data.get("beneficiary_name"),
                "emergency_type": data.get("emergency_type", "Immediate Emergency"),
                "description": data["description"],
                "status": "Triggered",
                "call_112_initiated": is_immediate,
                "asha_notified": True,
                "escalation_level": 3 if is_immediate else 1,
                "timestamp": now_iso,
                "resolved_at": None,
                "notes": "Emergency alert initiated. In simulation mode: emergency dispatch call 112 simulated, assigned ASHA alerted."
            }
            if self._firestore.is_connected:
                self._firestore.create_doc(unique_id, record)
            elif not getattr(settings, "DEMO_MODE", False):
                raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot trigger SOS event.")

        # Update cache ONLY after successful persistence
        self._events.insert(0, record)
        return record

    def acknowledge(self, event_id: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        self._ensure_synced()
        record = self.get_by_id(event_id)
        if not record:
            return None
        
        updated_notes = f"{record.get('notes', '')} | Acknowledged: {notes}" if notes else record.get("notes")
        update_data = {
            "status": "Acknowledged",
            "notes": updated_notes
        }

        # Attempt Firestore write before mutating in-memory cache
        if self._firestore.is_connected:
            self._firestore.set(event_id, update_data, merge=True)
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode.")

        record.update(update_data)
        return record

    def escalate(self, event_id: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        self._ensure_synced()
        record = self.get_by_id(event_id)
        if not record:
            return None
        
        new_level = min(3, record.get("escalation_level", 1) + 1)
        updated_notes = f"{record.get('notes', '')} | Escalated to level {new_level}: {notes}" if notes else record.get("notes")
        update_data = {
            "status": "Escalated",
            "escalation_level": new_level,
            "notes": updated_notes
        }

        # Attempt Firestore write before mutating in-memory cache
        if self._firestore.is_connected:
            self._firestore.set(event_id, update_data, merge=True)
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode.")

        record.update(update_data)
        return record

sos_repo = SosRepository()

