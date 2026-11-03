from pydantic import BaseModel, Field
from typing import Optional, List

class WorkActivityItem(BaseModel):
    id: str
    activity_date: str
    category: str  # Maternal health, Child health, Immunisation, Household visits, Community mobilisation, Health awareness
    description: str
    household_id: str
    beneficiary_name: Optional[str] = None
    eligible_for_claim: bool = True
    incentive_code: str
    estimated_amount: int  # in INR (illustrative)
    status: str = "Verified"  # Draft, Pending Review, Verified, Included In Claim

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
    status: str  # Draft, Submitted for Review, Approved by MO/ANM, Rejected, Payment Processed
    submitted_at: Optional[str] = None
    verified_at: Optional[str] = None
    payment_status: str  # Pending, Under Verification, Sanctioned, Disbursed
    supervisor_notes: Optional[str] = None
    disclaimer: str = "Disclaimer: Amounts and eligibility rules shown are illustrative for demonstration and claim-preparation assistance, not official government determinations."

