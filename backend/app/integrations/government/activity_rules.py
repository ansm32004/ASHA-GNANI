from typing import Dict, Any, List, Optional, Tuple

# Illustrative National Health Mission (NHM) / state ASHA incentive rates
# Disclaimed as non-official illustrative norms for prototype claim compilation
INCENTIVE_NORMS: List[Dict[str, Any]] = [
    {
        "code": "ASHA-MCH-01",
        "activity_type": "Pregnancy registration and antenatal care follow-ups",
        "category": "Maternal health",
        "title": "ANC registration & 4 checkups facilitation",
        "rate": 300,
        "eligibility_criteria": "Registration within 12 weeks of pregnancy and minimum 4 checkups accompanied."
    },
    {
        "code": "ASHA-MCH-02",
        "activity_type": "Institutional delivery support",
        "category": "Maternal health",
        "title": "Institutional delivery accompaniment (JSY)",
        "rate": 600,
        "eligibility_criteria": "Accompanied beneficiary to public health facility for institutional delivery."
    },
    {
        "code": "ASHA-HBNC-01",
        "activity_type": "Home visits",
        "category": "Child health",
        "title": "Home Based Newborn Care (HBNC) - Day 1, 3, 7, 14, 21, 28 visits",
        "rate": 250,
        "eligibility_criteria": "Complete set of institutional/home visits completed, temperature and weight logged in MCP card."
    },
    {
        "code": "ASHA-IMM-01",
        "activity_type": "Child immunisation and vaccination follow-ups",
        "category": "Immunisation",
        "title": "Full Immunisation mobilised for infant (under 1 year)",
        "rate": 400,
        "eligibility_criteria": "All due routine vaccines (BCG, OPV, Penta, MR-1) verified by ANM in U-WIN / RCH register."
    },
    {
        "code": "ASHA-TB-01",
        "activity_type": "TB treatment follow-ups",
        "category": "TB treatment",
        "title": "TB Treatment Supporter Honorarium (NTEP DOTS)",
        "rate": 1000,
        "eligibility_criteria": "Directly observed treatment supported through full regimen and outcome marked cured/completed in Ni-kshay."
    },
    {
        "code": "ASHA-COMM-01",
        "activity_type": "Routine household visit and awareness",
        "category": "Community mobilisation",
        "title": "VHSNC Monthly Meeting & Community Dialogue",
        "rate": 150,
        "eligibility_criteria": "Meeting organized with min 5 committee members and minutes drafted in Anganwadi register."
    },
    {
        "code": "ASHA-GEN-OTHER",
        "activity_type": "Other eligible NHM activities",
        "category": "Other eligible NHM activities",
        "title": "Special Health Drive / Camp / Non-standard Activity",
        "rate": None,  # Amount pending verification
        "eligibility_criteria": "Subject to MO/ANM post-campaign verification and special sanction order."
    }
]

# Configurable master guidelines for "Know Your Incentives"
STRUCTURED_GUIDELINES: List[Dict[str, Any]] = [
    {
        "id": "g_central_fixed",
        "category": "central_fixed",
        "category_label": "Central Fixed Incentive",
        "title": "Central Fixed Monthly Incentive",
        "amount_display": "₹3,500 / month",
        "amount_value": 3500,
        "frequency": "Monthly",
        "eligibility_conditions": "Monthly routine tasks completed: updating village health register, convening monthly VHSND sessions, attending PHC review meetings, and timely submission of monthly work reports.",
        "applicable_state": "All India (NHM)",
        "verification_required": True,
        "status": "active",
        "effective_date": "01-04-2024",
        "notes": "Core monthly honorarium provided under National Health Mission guidelines upon ANM verification."
    },
    {
        "id": "g_performance_anc",
        "category": "performance_based",
        "category_label": "Performance-Based",
        "title": "Pregnancy Registration & ANC Follow-ups",
        "amount_display": "₹300 per registered mother",
        "amount_value": 300,
        "frequency": "Per Activity",
        "eligibility_conditions": "Early pregnancy registration within 12 weeks, TT/Td vaccination, IFA distribution, and accompaniment for at least 4 antenatal checkups.",
        "applicable_state": "National Health Mission",
        "verification_required": True,
        "status": "active",
        "notes": "Payment compiled per mother verified in RCH portal."
    },
    {
        "id": "g_performance_jsy",
        "category": "performance_based",
        "category_label": "Performance-Based",
        "title": "Institutional Delivery Support (JSY)",
        "amount_display": "₹600 per delivery (Rural) / ₹400 (Urban)",
        "amount_value": 600,
        "frequency": "Per Activity",
        "eligibility_conditions": "Beneficiary accompanied to accredited government/private health facility for institutional delivery under Janani Suraksha Yojana.",
        "applicable_state": "National Health Mission",
        "verification_required": True,
        "status": "active",
        "notes": "Directly linked to hospital discharge slip and birth registry entry."
    },
    {
        "id": "g_performance_imm",
        "category": "performance_based",
        "category_label": "Performance-Based",
        "title": "Child Immunisation & Vaccination Follow-ups",
        "amount_display": "₹400 per fully immunised child",
        "amount_value": 400,
        "frequency": "Per Activity",
        "eligibility_conditions": "Child receives BCG, 3 doses of Rotavirus/Pentavalent/OPV, and Measles-Rubella before first birthday.",
        "applicable_state": "National Health Mission",
        "verification_required": True,
        "status": "active",
        "notes": "Verified against MCP card and Anganwadi tracking register."
    },
    {
        "id": "g_performance_hbnc",
        "category": "performance_based",
        "category_label": "Performance-Based",
        "title": "Home Based Newborn Care (HBNC)",
        "amount_display": "₹250 per newborn (6 visits)",
        "amount_value": 250,
        "frequency": "Per Activity",
        "eligibility_conditions": "Conduct 6 home visits for institutional delivery (Day 3, 7, 14, 21, 28, 42) or 7 visits for home delivery.",
        "applicable_state": "National Health Mission",
        "verification_required": True,
        "status": "active",
        "notes": "Temperature, feeding check, cord examination, and weighing required."
    },
    {
        "id": "g_performance_tb",
        "category": "performance_based",
        "category_label": "Performance-Based",
        "title": "TB Treatment Supervision & Follow-up (NTEP)",
        "amount_display": "₹1,000 per completed treatment",
        "amount_value": 1000,
        "frequency": "Per Activity",
        "eligibility_conditions": "DOTS treatment supporter role through completion of 6-month drug-sensitive TB regimen or ₹5,000 for drug-resistant TB.",
        "applicable_state": "NTEP Guidelines",
        "verification_required": True,
        "status": "active",
        "notes": "Disbursed via Ni-kshay portal integration."
    },
    {
        "id": "g_team_aam",
        "category": "team_incentive",
        "category_label": "Team-Based Incentive",
        "title": "Ayushman Arogya Mandir (AAM) Team Incentive",
        "amount_display": "Up to ₹1,000 / month",
        "amount_value": 1000,
        "frequency": "Team Target",
        "eligibility_conditions": "Achieved collective health and wellness centre targets: 100% NCD screening (hypertension & diabetes), wellness sessions, teleconsultation numbers, and timely reporting.",
        "applicable_state": "All India (AAM / AB-HWC)",
        "verification_required": True,
        "status": "active",
        "notes": "Subject to Community Health Officer (CHO) and Medical Officer team performance sign-off."
    },
    {
        "id": "g_state_delhi",
        "category": "state_incentive",
        "category_label": "State Government Top-Up",
        "title": "State Government Incentive (Delhi)",
        "amount_display": "₹3,000 (Announced increase to ₹6,000 pending gazette)",
        "amount_value": 3000,
        "frequency": "Monthly",
        "eligibility_conditions": "Active frontline duty within designated Delhi district dispensaries/mohallas.",
        "applicable_state": "Delhi (NCT)",
        "verification_required": True,
        "status": "guideline_pending_verification",
        "effective_date": "Sept 2026 (Announced proposal)",
        "notes": "Important Notice: The Delhi state government announced a proposed honorarium increase from ₹3,000 to ₹6,000 per month in September 2026. This entry serves as an operational guideline requiring official notification and administrative verification before treating it as an applicable entitlement."
    }
]

def get_incentive_by_category(category: str) -> Dict[str, Any]:
    cat_lower = category.lower()
    for norm in INCENTIVE_NORMS:
        if norm["category"].lower() in cat_lower or cat_lower in norm["category"].lower():
            return norm
    return INCENTIVE_NORMS[0]

def match_activity_norm(activity_type: str) -> Optional[Dict[str, Any]]:
    act_lower = activity_type.lower()
    for norm in INCENTIVE_NORMS:
        if norm["activity_type"].lower() == act_lower:
            return norm
        if norm["title"].lower() in act_lower or act_lower in norm["title"].lower():
            return norm
    for norm in INCENTIVE_NORMS:
        if norm["category"].lower() in act_lower:
            return norm
    return None

def calculate_activity_incentive(activity_type: str, count: int = 1) -> Tuple[Optional[int], bool]:
    norm = match_activity_norm(activity_type)
    if not norm or norm.get("rate") is None:
        return (None, True)  # Amount pending verification
    rate = norm["rate"]
    return (rate * max(1, count), False)

def get_incentive_guidelines(state: Optional[str] = "Delhi") -> List[Dict[str, Any]]:
    guidelines = STRUCTURED_GUIDELINES.copy()
    if state and state.lower() != "delhi":
        guidelines = [g for g in guidelines if g["applicable_state"] != "Delhi (NCT)"]
    return guidelines
