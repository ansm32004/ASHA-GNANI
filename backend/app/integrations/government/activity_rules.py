from typing import Dict, Any, List

# Illustrative National Health Mission (NHM) / state ASHA incentive rates
# Disclaimed as non-official illustrative norms for prototype claim compilation
INCENTIVE_NORMS: List[Dict[str, Any]] = [
    {
        "code": "ASHA-MCH-01",
        "category": "Maternal health",
        "title": "ANC registration & 4 checkups facilitation",
        "rate": 300,
        "eligibility_criteria": "Registration within 12 weeks and minimum 4 checkups accompanied."
    },
    {
        "code": "ASHA-MCH-02",
        "category": "Maternal health",
        "title": "Institutional delivery accompaniment (JSY)",
        "rate": 600,
        "eligibility_criteria": "Accompanied beneficiary to public health facility for delivery."
    },
    {
        "code": "ASHA-HBNC-01",
        "category": "Child health",
        "title": "Home Based Newborn Care (HBNC) - Day 1, 3, 7, 14, 21, 28 visits",
        "rate": 250,
        "eligibility_criteria": "Complete set of 6 institutional/home visits completed and logged."
    },
    {
        "code": "ASHA-IMM-01",
        "category": "Immunisation",
        "title": "Full Immunisation mobilised for infant (under 1 year)",
        "rate": 400,
        "eligibility_criteria": "All due vaccines (BCG, OPV, Penta, MR-1) verified by ANM."
    },
    {
        "code": "ASHA-COMM-01",
        "category": "Community mobilisation",
        "title": "VHSNC Monthly Meeting coordination",
        "rate": 150,
        "eligibility_criteria": "Meeting organized with min 5 committee members and minutes drafted."
    },
    {
        "code": "ASHA-NUTR-01",
        "category": "Health awareness",
        "title": "Poshan awareness & severe acute malnutrition (SAM) screening",
        "rate": 200,
        "eligibility_criteria": "Growth chart monitoring and red-zone referral."
    }
]

def get_incentive_by_category(category: str) -> Dict[str, Any]:
    for norm in INCENTIVE_NORMS:
        if norm["category"].lower() == category.lower():
            return norm
    return INCENTIVE_NORMS[0]

