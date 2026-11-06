from typing import List, Optional, Dict, Any
from app.config import settings
from app.repositories.mock_data import generate_mock_claims, DEMO_USER
from app.integrations.firebase.firestore_repository import FirestoreRepository
from app.core.logging import logger
from datetime import datetime

class ClaimRepository:
    def __init__(self):
        self._firestore = FirestoreRepository("claims")
        self._claims: List[Dict[str, Any]] = generate_mock_claims()
        self._initialized_db = False

    def _ensure_synced(self):
        if not self._firestore.is_connected:
            return
        if not self._initialized_db:
            try:
                self._firestore.seed_if_empty(self._claims, id_key="id")
                remote_docs = self._firestore.list_all()
                if remote_docs:
                    self._claims = remote_docs
                self._initialized_db = True
            except Exception as e:
                logger.warning(f"ClaimRepository sync warning: {e}")

    def list_all(self, asha_id: Optional[str] = None) -> List[Dict[str, Any]]:
        self._ensure_synced()
        if self._firestore.is_connected:
            try:
                remote_docs = self._firestore.list_all()
                if remote_docs:
                    self._claims = remote_docs
            except Exception as e:
                logger.warning(f"Could not refresh claims from Firestore: {e}")

        results = self._claims.copy()
        if asha_id:
            results = [c for c in results if c.get("asha_id") == asha_id]
        return results

    def get_by_id(self, claim_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_synced()
        if self._firestore.is_connected:
            try:
                doc = self._firestore.get(claim_id)
                if doc:
                    return doc
            except Exception as e:
                logger.warning(f"Error fetching claim {claim_id} from Firestore: {e}")

        for c in self._claims:
            if c["id"] == claim_id:
                return c
        return None

    def prepare_claim(self, month: str, year: int = 2026, activity_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        self._ensure_synced()
        claim_id = f"claim_{year}_{month.lower().replace(' ', '_')}"

        # Check if already in list or Firestore
        existing = self.get_by_id(claim_id)
        if existing:
            return existing

        # Configurable illustrative mock activities
        sample_activities = [
            {
                "id": "act_new_01",
                "activity_date": f"{year}-11-02",
                "category": "Maternal health",
                "description": "Antenatal checkup assistance & birth planning for Meena Devi",
                "household_id": "hh_001",
                "beneficiary_name": "Meena Devi",
                "eligible_for_claim": True,
                "incentive_code": "ASHA-MCH-01",
                "estimated_amount": 300,
                "status": "Verified"
            },
            {
                "id": "act_new_02",
                "activity_date": f"{year}-11-01",
                "category": "Child health",
                "description": "Postnatal home visit (Day 7) for newborn of Rekha Sharma",
                "household_id": "hh_002",
                "beneficiary_name": "Golu Sharma",
                "eligible_for_claim": True,
                "incentive_code": "ASHA-HBNC-02",
                "estimated_amount": 250,
                "status": "Verified"
            },
            {
                "id": "act_new_03",
                "activity_date": f"{year}-10-29",
                "category": "Immunisation",
                "description": "Mobilised 6 children for Wednesday session at Anganwadi",
                "household_id": "hh_004",
                "beneficiary_name": "Ananya Singh & others",
                "eligible_for_claim": True,
                "incentive_code": "ASHA-IMM-01",
                "estimated_amount": 400,
                "status": "Verified"
            },
            {
                "id": "act_new_04",
                "activity_date": f"{year}-10-27",
                "category": "Community mobilisation",
                "description": "Participated in Village Health Sanitation and Nutrition Committee meeting",
                "household_id": "hh_003",
                "beneficiary_name": "VHSNC Members",
                "eligible_for_claim": True,
                "incentive_code": "ASHA-COMM-01",
                "estimated_amount": 150,
                "status": "Verified"
            },
            {
                "id": "act_new_05",
                "activity_date": f"{year}-10-25",
                "category": "Health awareness",
                "description": "Conducted Poshan awareness and anemia screening dialogue in Ward 3",
                "household_id": "hh_005",
                "beneficiary_name": "Kisan Basti Families",
                "eligible_for_claim": True,
                "incentive_code": "ASHA-NUTR-01",
                "estimated_amount": 200,
                "status": "Verified"
            }
        ]

        total_amount = sum(a["estimated_amount"] for a in sample_activities)

        new_claim = {
            "id": claim_id,
            "month": month,
            "year": year,
            "asha_id": DEMO_USER["id"],
            "asha_name": DEMO_USER["name"],
            "activities_count": len(sample_activities),
            "activities": sample_activities,
            "total_estimated_amount": total_amount,
            "status": "Draft",
            "submitted_at": None,
            "verified_at": None,
            "payment_status": "Pending",
            "supervisor_notes": "Draft prepared. Ready for ASHA review and submission to ANM/MO.",
            "disclaimer": "Disclaimer: Amounts and eligibility rules shown are illustrative for demonstration and claim-preparation assistance, not official government determinations."
        }

        from google.api_core.exceptions import AlreadyExists

        if self._firestore.is_connected:
            try:
                self._firestore.create_doc(claim_id, new_claim)
            except AlreadyExists:
                existing = self.get_by_id(claim_id)
                if existing:
                    return existing
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot prepare claim.")

        self._claims.insert(0, new_claim)
        return new_claim

    def submit_claim(self, claim_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_synced()
        record = self.get_by_id(claim_id)
        if not record:
            return None

        update_data = {
            "status": "Submitted for Review",
            "submitted_at": datetime.now().isoformat() + "Z",
            "payment_status": "Under Verification",
            "supervisor_notes": "Claim submitted to Medical Officer & ANM for verification against RCH register."
        }

        # Attempt Firestore write before mutating in-memory cache
        if self._firestore.is_connected:
            self._firestore.set(claim_id, update_data, merge=True)
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot submit claim.")

        record.update(update_data)
        return record

    def update(self, claim_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        self._ensure_synced()
        record = self.get_by_id(claim_id)
        if not record:
            return None
        clean_updates = {k: v for k, v in data.items() if v is not None}
        if self._firestore.is_connected:
            self._firestore.set(claim_id, clean_updates, merge=True)
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot update claim.")
        record.update(clean_updates)
        return record

    def delete(self, claim_id: str) -> bool:
        self._ensure_synced()
        record = self.get_by_id(claim_id)
        if not record:
            return False
        if self._firestore.is_connected:
            self._firestore.delete(claim_id)
        self._claims = [c for c in self._claims if c.get("id") != claim_id]
        return True

claim_repo = ClaimRepository()

