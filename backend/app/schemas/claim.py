from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class WorkActivityItem(BaseModel):
    id: str
    activity_date: str
    category: str  # Maternal health, Child health, Immunisation, Household visits, Community mobilisation, Health awareness, TB treatment, etc.
    description: str
    household_id: Optional[str] = "hh_001"
    beneficiary_name: Optional[str] = None
    eligible_for_claim: bool = True
    incentive_code: str = "ASHA-GEN-01"
    estimated_amount: int = 0  # in INR (illustrative)
    amount_pending_verification: bool = False
    status: str = "Verified"  # Draft, Pending Review, Verified, Included In Claim

class CreateClaimActivity(BaseModel):
    activity_type: str
    category: str
    activity_date: str
    household_id: Optional[str] = None
    beneficiary_name: Optional[str] = None
    completed_count: int = 1
    estimated_amount: Optional[int] = None
    amount_pending_verification: bool = False
    notes: Optional[str] = None
    supporting_evidence: Optional[str] = None

class CreateClaimRequest(BaseModel):
    month: str  # e.g., "November 2026" or "November"
    year: int = 2026
    category: str
    activities: List[CreateClaimActivity]
    supporting_notes: Optional[str] = None
    total_estimated_amount: Optional[int] = None
    amount_pending_verification: bool = False

class ClaimPrepareRequest(BaseModel):
    month: str  # e.g., "October 2026"
    activity_ids: Optional[List[str]] = None

class ClaimResponse(BaseModel):
    id: str
    month: str
    year: int
    asha_id: str
    asha_name: str
    activities_count: int
    activities: List[WorkActivityItem] = []
    total_estimated_amount: int  # in INR
    amount_pending_verification: bool = False
    status: str  # Draft, Submitted for Review, Under Verification, Approved by MO/ANM, Rejected, Paid, Payment Processed
    rejection_reason: Optional[str] = None
    submitted_at: Optional[str] = None
    verified_at: Optional[str] = None
    payment_status: str  # Pending, Under Verification, Sanctioned, Disbursed, Paid, Rejected
    supervisor_notes: Optional[str] = None
    supporting_notes: Optional[str] = None
    category: Optional[str] = None
    disclaimer: str = "Disclaimer: Amounts and eligibility rules shown are illustrative for demonstration and claim-preparation assistance, not official government determinations."

class IncentiveGuideline(BaseModel):
    id: str
    category: str  # central_fixed, performance_based, team_incentive, state_incentive
    category_label: str
    title: str
    amount_display: str
    amount_value: Optional[int] = None
    frequency: str  # Monthly, Per Activity, Team Target
    eligibility_conditions: str
    applicable_state: Optional[str] = None
    verification_required: bool = True
    status: str = "active"  # active, guideline_pending_verification
    effective_date: Optional[str] = None
    notes: Optional[str] = None

class EarningsOverview(BaseModel):
    total_earned: int
    pending_claims: int
    eligible_to_claim: int
    paid: int
    total_claims_count: int
    status_counts: Dict[str, int] = {}
    last_updated: Optional[str] = None
