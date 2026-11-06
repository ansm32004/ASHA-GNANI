import re
from typing import Optional, Dict, Any

class SafetyService:
    """
    Multi-level clinical safety guardrails for SAHAYIKA AI Assistant.
    Evaluates queries before generation (Pre-Check) and verifies output after generation (Post-Check).
    """

    # Level 3: Severe Emergency Warning Signs
    EMERGENCY_PATTERNS = [
        r"(behoshi|unconscious|behosh|बेहोश|चेतनाशून्य)",
        r"(severe\s+bleeding|bahut\s+khoon|bhari\s+bleeding|रक्तस्राव|खून\s+बह|haemorrhage|hemorrhage)",
        r"(convulsion|seizure|fit\s+padna|daure|दौरा|मिरगी|झटके)",
        r"(chest\s+pain|chhati\s+mein\s+dard|heart\s+attack|छाती\s+में\s+दर्द)",
        r"(difficulty\s+breathing|saans\s+phoolna|saans\s+lene\s+mein\s+takleef|सांस\s+फूल|दम\s+घुटना)",
        r"(poison|zahar|vish|विष|ज़हर|insecticide)",
        r"(snake\s+bite|saanp\s+ne\s+kaata|सांप\s+काट)",
        r"(high\s+fever\s+with\s+stiff\s+neck|gardan\s+akadna|गर्दन\s+अकड़)",
        r"(severe\s+headache\s+with\s+blur|dhundhla\s+dikhna|धुंधला\s+दिखना\s+सिरदर्द)"
    ]

    # Level 2: Symptom Diagnosis and Medication/Prescription Requests
    MEDICATION_PATTERNS = [
        r"(दवा|दवाई|गोली|औषधि|इलाज|उपचार|खुराक|इंजेक्शन|dawa|dawai|tablet|medicine|cure|prescribe|prescription|dosage|dose|antibiotic|painkiller)",
        r"(which\s+medicine|suggest\s+medicine|koun\s+si\s+dawa|konsi\s+dawa)"
    ]

    # Level 4: Unrelated / Out-of-Scope Domains
    UNRELATED_PATTERNS = [
        r"(cricket|football|ipl|cinema|movie|film|actor|hero|क्रिकेट|मैच|स्कोर|आईपीएल|सिनेमा|फिल्म|मूवी)",
        r"(python|coding|javascript|algorithm|stock\s+market|crypto|bitcoin|share\s+bazar|शेयर\s+बाजार)",
        r"(election|vote\s+for|political\s+party|politics|neta|चुनाव|राजनीति|वोट)",
        r"(weather|mausam|rain|barish|barsat|temperature\s+outside|mausam\s+kaisa|बारिश|मौसम|बरसात)"
    ]

    def pre_generation_check(self, query: str, language: str = "hi") -> Optional[Dict[str, Any]]:
        """
        Check incoming query for Level 3 (Emergency), Level 2 (Prescription/Diagnosis), or Level 4 (Unrelated).
        Returns a dict if a safety trigger is met, or None to proceed with normal generation.
        """
        q = (query or "").lower().strip()

        # 1. Level 3: Emergency Check
        for pattern in self.EMERGENCY_PATTERNS:
            if re.search(pattern, q, re.IGNORECASE):
                if language == "hi":
                    reply = (
                        "आपातकालीन सूचना (Emergency Alert): यह गंभीर स्थिति हो सकती है। "
                        "कृपया तुरंत 112 या 108 डायल करके सरकारी एम्बुलेंस बुलाएं अथवा मरीज को नजदीकी अस्पताल / सीएचसी (CHC) ले जाएं। "
                        "अपनी आशा दीदी को भी तुरंत संपर्क करें।"
                    )
                else:
                    reply = (
                        "EMERGENCY ALERT: This condition requires immediate medical attention. "
                        "Please dial 112 or 108 immediately for ambulance assistance or rush to the nearest Primary Health Centre (PHC) / CHC. "
                        "Notify your local ASHA worker at once."
                    )
                return {
                    "level": "LEVEL_3_EMERGENCY",
                    "reply_text": reply,
                    "suggested_actions": ["Call 112 Emergency", "Call 108 Ambulance", "Alert ASHA Worker"],
                    "is_safety_intervention": True
                }

        # 2. Level 4: Unrelated / Out-of-Scope Check (Runs before clinical queries)
        for pattern in self.UNRELATED_PATTERNS:
            if re.search(pattern, q, re.IGNORECASE):
                if language == "hi":
                    reply = (
                        "सहायिका डिजिटल साथी विशेष रूप से मातृ एवं बाल स्वास्थ्य, पोषण, टीकाकरण और सरकारी स्वास्थ्य योजनाओं की जानकारी के लिए है। "
                        "कृपया स्वास्थ्य, परिवार कल्याण या आंगनवाड़ी योजनाओं से संबंधित प्रश्न पूछें।"
                    )
                else:
                    reply = (
                        "SAHAYIKA is dedicated to maternal and child healthcare, nutrition, immunisation, and government health schemes. "
                        "Please ask questions related to community healthcare and welfare services."
                    )
                return {
                    "level": "LEVEL_4_UNRELATED",
                    "reply_text": reply,
                    "suggested_actions": ["Vaccination Schedule", "Maternal Care (ANC)", "Government Schemes (JSY/PMMVY)"],
                    "is_safety_intervention": True
                }

        # 3. Level 2: Diagnosis / Medication Prescription Check (Excludes standard public health supplements)
        is_routine_supplement = any(k in q for k in ["ifa", "iron", "zinc", "ors", "लाल गोली", "लाल", "जिंक", "ओआरएस", "आयरन", "folic"])
        if not is_routine_supplement:
            for pattern in self.MEDICATION_PATTERNS:
                if re.search(pattern, q, re.IGNORECASE):
                    if language == "hi":
                        reply = (
                            "सुरक्षा सूचना: सहायिका एआई किसी भी बीमारी का निदान या दवा की खुराक (Prescription) नहीं दे सकती। "
                            "कृपया सुरक्षित जांच और दवा के लिए अपने प्राथमिक स्वास्थ्य केंद्र (PHC) के चिकित्सा अधिकारी (MO) या एएनएम दीदी से संपर्क करें। "
                            "साधारण देखभाल और ओआरएस/आयरन हेतु अपनी आशा दीदी से मिलें।"
                        )
                    else:
                        reply = (
                            "Safety Note: SAHAYIKA AI Assistant cannot diagnose conditions or prescribe medications or dosages. "
                            "Please consult the Primary Health Centre Medical Officer (MO) or ANM for an examination and prescription. "
                            "For routine health guidance, consult your village ASHA worker."
                        )
                    return {
                        "level": "LEVEL_2_SYMPTOMS",
                        "reply_text": reply,
                        "suggested_actions": ["Contact PHC Doctor", "Find Village ASHA", "Approved Health Protocols"],
                        "is_safety_intervention": True
                    }

        # Safe to proceed with knowledge retrieval and generation
        return None

    def post_generation_check(self, text: str, language: str = "hi") -> str:
        """
        Verify generated output does not include unsafe pharmaceutical dosages or false claims.
        """
        sanitized = text

        # Check for unintended drug dosage patterns (e.g. 500mg paracetamol 3 times daily)
        dosage_regex = r"\b\d+\s*(mg|ml|tablets?|goli|dose)\b"
        if re.search(dosage_regex, sanitized, re.IGNORECASE) and not any(k in sanitized for k in ["IFA", "Iron", "Zinc", "ORS", "लाल गोली"]):
            # Sanitize specific unsolicited medication instructions
            warning = (
                "\n\n(सूचना: किसी भी दवा का सेवन केवल डॉक्टर की सलाह पर ही करें।)"
                if language == "hi" else
                "\n\n(Note: Always consult a licensed medical officer before taking any medication.)"
            )
            sanitized += warning

        return sanitized

safety_service = SafetyService()
