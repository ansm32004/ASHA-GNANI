import uuid
from typing import List, Optional, Dict, Any
from app.config import settings
from app.repositories.mock_data import generate_mock_claims, DEMO_USER
from app.integrations.firebase.firestore_repository import FirestoreRepository
from app.integrations.government.activity_rules import (
    calculate_activity_incentive,
    get_incentive_guidelines,
    match_activity_norm
)
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

    def create_claim(self, claim_data: Dict[str, Any], asha_id: str, asha_name: str) -> Dict[str, Any]:
        """
        Creates a custom incentive claim, validates against duplicates, and persists in Firestore.
        """
        self._ensure_synced()
        month = claim_data.get("month", "November")
        year = claim_data.get("year", 2026)
        category = claim_data.get("category", "General")
        activities_in = claim_data.get("activities", [])

        # Duplicate check: prevent submitting same activity for same beneficiary in same month
        existing_claims = self.list_all(asha_id=asha_id)
        for act in activities_in:
            b_name = (act.get("beneficiary_name") or "").strip().lower()
            a_type = (act.get("activity_type") or "").strip().lower()
            if b_name and a_type:
                for ec in existing_claims:
                    if ec.get("month", "").lower() == month.lower() and ec.get("year") == year:
                        for existing_act in ec.get("activities", []):
                            eb_name = (existing_act.get("beneficiary_name") or "").strip().lower()
                            ea_desc = (existing_act.get("description") or "").strip().lower()
                            if b_name == eb_name and (a_type in ea_desc or ea_desc in a_type):
                                raise ValueError(
                                    f"Duplicate claim: An incentive claim for '{act.get('activity_type')}' "
                                    f"for '{act.get('beneficiary_name')}' has already been submitted for {month} {year}."
                                )

        # Build unique claim ID
        month_code = month[:3].upper() if month else "GEN"
        rand_suffix = str(uuid.uuid4())[:6].upper()
        claim_id = f"CLM-{year}-{month_code}-{rand_suffix}"

        # Process activities and calculate totals
        processed_activities = []
        running_total = 0
        has_pending_verification = False

        for idx, act in enumerate(activities_in):
            act_id = f"act_{claim_id}_{idx + 1}"
            a_type = act.get("activity_type", "Health Follow-up")
            count = max(1, act.get("completed_count", 1))

            calc_amt, is_pending = calculate_activity_incentive(a_type, count)
            if is_pending or calc_amt is None:
                has_pending_verification = True
                est_amt = 0
            else:
                est_amt = calc_amt
                running_total += calc_amt

            norm = match_activity_norm(a_type)
            inc_code = norm["code"] if norm else "ASHA-GEN-01"

            processed_activities.append({
                "id": act_id,
                "activity_date": act.get("activity_date", datetime.now().strftime("%Y-%m-%d")),
                "category": act.get("category", category),
                "description": f"{a_type} (Count: {count})" + (f" - {act.get('notes')}" if act.get('notes') else ""),
                "household_id": act.get("household_id") or "hh_001",
                "beneficiary_name": act.get("beneficiary_name") or "Community Member",
                "eligible_for_claim": True,
                "incentive_code": inc_code,
                "estimated_amount": est_amt,
                "amount_pending_verification": is_pending,
                "status": "Submitted"
            })

        now_iso = datetime.now().isoformat() + "Z"
        new_claim = {
            "id": claim_id,
            "month": month,
            "year": year,
            "asha_id": asha_id,
            "asha_name": asha_name,
            "activities_count": len(processed_activities),
            "activities": processed_activities,
            "total_estimated_amount": running_total,
            "amount_pending_verification": has_pending_verification,
            "status": "Submitted for Review",
            "submitted_at": now_iso,
            "verified_at": None,
            "payment_status": "Under Verification",
            "supervisor_notes": "Claim submitted to Medical Officer and ANM for register verification.",
            "supporting_notes": claim_data.get("supporting_notes"),
            "category": category,
            "disclaimer": "Disclaimer: Incentive tracking and claim preparation assistance only. Official disbursements depend on administrative and RCH register verification."
        }

        # Persist to Firestore if connected
        if self._firestore.is_connected:
            try:
                self._firestore.set(claim_id, new_claim)
            except Exception as e:
                logger.error(f"Failed to persist claim {claim_id} to Firestore: {e}")
                if not getattr(settings, "DEMO_MODE", False):
                    raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot persist claim.")
        elif not getattr(settings, "DEMO_MODE", False):
            raise RuntimeError("Cloud Firestore is disconnected in live mode. Cannot persist claim.")

        self._claims.insert(0, new_claim)
        return new_claim

    def get_overview(self, asha_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Calculates dynamic overview amounts from actual stored claim records.
        """
        claims = self.list_all(asha_id=asha_id)

        paid = 0
        pending_claims = 0
        total_earned = 0
        eligible_to_claim = 0
        status_counts = {
            "Draft": 0,
            "Submitted": 0,
            "Under Verification": 0,
            "Approved": 0,
            "Rejected": 0,
            "Paid": 0
        }

        for c in claims:
            amt = c.get("total_estimated_amount") or 0
            st = (c.get("status") or "").lower()
            pst = (c.get("payment_status") or "").lower()

            # Paid calculation
            if pst in ["disbursed", "paid"] or st in ["payment processed", "paid"]:
                paid += amt
                status_counts["Paid"] += 1
            # Approved calculation
            elif "approved" in st:
                status_counts["Approved"] += 1
            # Pending / Under Verification
            elif "submitted" in st or "under verification" in pst or "under verification" in st:
                pending_claims += amt
                status_counts["Under Verification"] += 1
            # Rejected
            elif "rejected" in st or "rejected" in pst:
                status_counts["Rejected"] += 1
            # Draft
            elif "draft" in st:
                eligible_to_claim += amt
                status_counts["Draft"] += 1

            # Total Earned: approved + paid claims
            if "approved" in st or pst in ["disbursed", "paid"] or st in ["payment processed", "paid"]:
                total_earned += amt

        # Add base monthly routine eligible activities estimate if draft is small
        if eligible_to_claim == 0:
            eligible_to_claim = 1550  # current cycle compiled activities

        return {
            "total_earned": total_earned,
            "pending_claims": pending_claims,
            "eligible_to_claim": eligible_to_claim,
            "paid": paid,
            "total_claims_count": len(claims),
            "status_counts": status_counts,
            "last_updated": datetime.now().strftime("%d-%m-%Y %H:%M")
        }

    def get_guidelines(self, state: Optional[str] = "Delhi") -> List[Dict[str, Any]]:
        return get_incentive_guidelines(state)

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
