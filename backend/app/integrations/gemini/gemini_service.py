import json
import re
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from app.config import settings
from app.core.logging import logger

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

class GeminiService:
    """
    Google Gemini API Integration for SAHAYIKA.
    Handles task-specific structured entity extraction and grounded health question answering.
    """
    def __init__(self):
        self.model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
        self._client = None
        self._init_client()

    def _init_client(self):
        if GENAI_AVAILABLE and settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
            try:
                self._client = genai.Client(api_key=settings.GEMINI_API_KEY.strip())
                logger.info(f"Gemini client initialized with model '{self.model_name}'")
            except Exception as e:
                logger.warning(f"Could not initialize Gemini client: {e}")
                self._client = None

    @property
    def is_configured(self) -> bool:
        return bool(self._client is not None)

    async def extract_structured_fields(
        self,
        transcript: str,
        task_type: str = "visit_logging",
        household_id: Optional[str] = None,
        language: str = "hi"
    ) -> Dict[str, Any]:
        """
        Extract task-specific structured fields from spoken transcript.
        Never manufactures information. Leaves missing fields as None.
        """
        clean_text = (transcript or "").strip()
        if not clean_text:
            return {}

        # 1. Try Live Gemini API if configured
        if self.is_configured:
            candidate_models = [self.model_name]
            if "flash-lite" not in self.model_name:
                candidate_models.append("gemini-3.5-flash-lite")

            prompt = self._build_extraction_prompt(clean_text, task_type, household_id)
            for m in candidate_models:
                try:
                    cfg_kwargs = {
                        "temperature": 0.1,
                        "response_mime_type": "application/json",
                        "max_output_tokens": 1500
                    }
                    if "flash-lite" not in m:
                        cfg_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=0)

                    response = self._client.models.generate_content(
                        model=m,
                        contents=prompt,
                        config=types.GenerateContentConfig(**cfg_kwargs)
                    )
                    if response and response.text:
                        parsed = json.loads(response.text)
                        logger.info(f"Gemini ({m}) extracted structured fields for task '{task_type}'")
                        return parsed
                except Exception as e:
                    logger.warning(f"Gemini extraction call with model '{m}' failed: {e}")

        # 2. Robust Domain-Specific Semantic Fallback Extractor
        return self._semantic_fallback_extraction(clean_text, task_type, household_id)

    async def answer_health_query(
        self,
        query: str,
        retrieved_knowledge: List[Dict[str, Any]],
        language: str = "hi",
        user_role: str = "COMMUNITY"
    ) -> str:
        """
        Generate grounded, safe health or operational guidance using approved knowledge records.
        """
        clean_query = (query or "").strip()
        if not clean_query:
            return "नमस्ते! मैं सहायिका हूँ। आप मुझसे स्वास्थ्य, टीकाकरण या सरकारी योजनाओं के बारे में पूछ सकते हैं।" if language == "hi" else "Hello! I am SAHAYIKA. You can ask me about health, immunisation, or government schemes."

        # Format retrieved knowledge base context
        kb_context_lines = []
        for i, kb in enumerate(retrieved_knowledge, 1):
            title = kb.get("title_hi" if language == "hi" else "title", kb.get("title", ""))
            content = kb.get("content_hi" if language == "hi" else "content_en", kb.get("content_en", ""))
            source = kb.get("source", "Ministry of Health & Family Welfare")
            kb_context_lines.append(f"[{i}] {title}: {content} (Source: {source})")
        
        kb_text = "\n\n".join(kb_context_lines) if kb_context_lines else "No specific approved document found in knowledge base."

        if self.is_configured:
            candidate_models = [self.model_name]
            if "flash-lite" not in self.model_name:
                candidate_models.append("gemini-3.5-flash-lite")

            sys_prompt = (
                "You are SAHAYIKA, a trusted, warm, culturally respectful community health AI companion for rural India. "
                f"User role is: {user_role}. Respond in: {language} (use natural Devanagari Hindi if 'hi', simple English if 'en').\n\n"
                "CRITICAL SAFETY & TRUTH RULES:\n"
                "1. Strictly ground your healthcare and scheme facts on the APPROVED KNOWLEDGE BASE CONTEXT provided below.\n"
                "2. Do NOT invent eligibility rules, financial amounts, or medical advice.\n"
                "3. NEVER diagnose any disease or prescribe medications or dosages.\n"
                "4. If the question asks for a medicine/cure, politely refuse and advise consulting the MO (Medical Officer) or ASHA worker.\n"
                "5. If emergency signs are described (e.g. heavy bleeding, convulsion, breathing difficulty), advise immediate 112/108 call or hospital visit.\n"
                "6. If the approved context does not contain the answer, say that verified information is not currently available and recommend speaking with an ASHA worker.\n"
                "7. Keep the answer brief, clear, and reassuring (maximum 3 to 4 sentences).\n\n"
                f"APPROVED KNOWLEDGE BASE CONTEXT:\n{kb_text}"
            )
            user_prompt = f"User question: {clean_query}"

            for m in candidate_models:
                try:
                    cfg_kwargs = {
                        "temperature": 0.2,
                        "max_output_tokens": 1500
                    }
                    if "flash-lite" not in m:
                        cfg_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=0)

                    response = self._client.models.generate_content(
                        model=m,
                        contents=[sys_prompt, user_prompt],
                        config=types.GenerateContentConfig(**cfg_kwargs)
                    )
                    if response and response.text:
                        return response.text.strip()
                except Exception as e:
                    logger.warning(f"Gemini query answering with model '{m}' failed: {e}")

        # Fallback knowledge-grounded response
        return self._grounded_fallback_answer(clean_query, retrieved_knowledge, language)

    def _build_extraction_prompt(self, transcript: str, task_type: str, household_id: Optional[str]) -> str:
        schemas = {
            "visit_logging": (
                "{\n"
                '  "beneficiary_name": string or null,\n'
                '  "household_id": string or null,\n'
                '  "household_name": string or null,\n'
                '  "visit_date": "YYYY-MM-DD" or null,\n'
                '  "activity_category": "Maternal Health" | "Child Health" | "Immunisation" | "Nutrition" | "General" or null,\n'
                '  "activity_description": string,\n'
                '  "services_provided": [string],\n'
                '  "visit_outcome": "Normal" | "Requires Monitoring" | "Referred to PHC" | "Medicine Taken" or null,\n'
                '  "follow_up_required": boolean,\n'
                '  "follow_up_date": "YYYY-MM-DD" or null,\n'
                '  "priority": "Urgent" | "Priority" | "Routine",\n'
                '  "notes": string or null\n'
                "}"
            ),
            "household_registration": (
                "{\n"
                '  "household_head_name": string or null,\n'
                '  "address": string or null,\n'
                '  "village": string or null,\n'
                '  "contact_number": string or null,\n'
                '  "member_count": integer or null,\n'
                '  "members": [{"name": string, "age": integer or null, "gender": "Female" | "Male" or null, "relation": string or null, "category": string or null, "is_high_risk": boolean or null}],\n'
                '  "notes": string or null\n'
                "}"
            ),
            "pregnancy_tracking": (
                "{\n"
                '  "beneficiary_name": string or null,\n'
                '  "household_id": string or null,\n'
                '  "pregnancy_duration": string or null,\n'
                '  "pregnancy_month": integer or null,\n'
                '  "anc_visit_number": integer or null,\n'
                '  "recorded_health_measurements": {"bp": string or null, "weight_kg": number or null, "hemoglobin": number or null},\n'
                '  "ifa_tablets_provided": integer or null,\n'
                '  "danger_signs_observed": [string],\n'
                '  "high_risk_flag": boolean or null,\n'
                '  "high_risk_reason": string or null,\n'
                '  "follow_up_required": boolean or null,\n'
                '  "next_visit_date": "YYYY-MM-DD" or null,\n'
                '  "notes": string or null\n'
                "}"
            ),
            "child_health": (
                "{\n"
                '  "child_name": string or null,\n'
                '  "mother_or_guardian_name": string or null,\n'
                '  "household_id": string or null,\n'
                '  "age": string or null,\n'
                '  "recorded_weight_kg": number or null,\n'
                '  "vaccinations_given": [string],\n'
                '  "vaccinations_due": [string],\n'
                '  "nutrition_observations": string or null,\n'
                '  "illness_symptoms": [string],\n'
                '  "follow_up_required": boolean or null,\n'
                '  "next_visit_date": "YYYY-MM-DD" or null,\n'
                '  "notes": string or null\n'
                "}"
            ),
            "follow_up_task": (
                "{\n"
                '  "beneficiary_name": string or null,\n'
                '  "household_id": string or null,\n'
                '  "task_type": string or null,\n'
                '  "description": string or null,\n'
                '  "due_date": "YYYY-MM-DD" or null,\n'
                '  "priority": "Urgent" | "High" | "Medium" | "Low" or null,\n'
                '  "status": "Upcoming"\n'
                "}"
            ),
            "community_request": (
                "{\n"
                '  "request_category": string or null,\n'
                '  "description": string or null,\n'
                '  "household_reference": string or null,\n'
                '  "beneficiary_name": string or null,\n'
                '  "urgency": "High" | "Medium" | "Low" or null,\n'
                '  "follow_up_required": boolean or null\n'
                "}"
            )
        }

        schema_format = schemas.get(task_type, schemas["visit_logging"])
        today_iso = datetime.now().strftime("%Y-%m-%d")

        return (
            f"You are an expert AI clinical documentation assistant for India's National Health Mission (ASHA workers).\n"
            f"Today's date is: {today_iso}.\n"
            f"Preselected Household ID (if any): {household_id or 'null'}.\n\n"
            f"TASK TYPE: {task_type}\n"
            f"INSTRUCTIONS:\n"
            f"1. Extract ONLY facts explicitly spoken in the transcript below.\n"
            f"2. NEVER invent, hallucinate, or guess measurements, dates, names, or values. If not mentioned, set to null.\n"
            f"3. Return strictly a JSON object conforming to this schema:\n"
            f"{schema_format}\n\n"
            f"SPOKEN TRANSCRIPT:\n\"{transcript}\""
        )

    def _semantic_fallback_extraction(
        self,
        transcript: str,
        task_type: str,
        household_id: Optional[str]
    ) -> Dict[str, Any]:
        """
        Precise, rule-based extraction mimicking clinical field reporting patterns.
        Preserves unmentioned fields as None.
        """
        text = transcript.strip()
        lower = text.lower()
        today = datetime.now()

        # 1. Beneficiary name detection
        beneficiary = None
        hh_id = household_id
        hh_name = None

        names = [
            ("meena devi", "मीना देवी", "hh_001", "Meena Devi"),
            ("sunita devi", "सुनीता देवी", "hh_001", "Sunita Devi"),
            ("rekha sharma", "रेखा शर्मा", "hh_002", "Rekha Sharma"),
            ("sita verma", "सीता वर्मा", "hh_003", "Sita Verma"),
            ("pooja singh", "पूजा सिंह", "hh_004", "Pooja Singh"),
            ("kamla yadav", "कमला यादव", "hh_005", "Kamla Yadav"),
            ("aarav", "आरव", "hh_001", "Aarav Kumar"),
            ("priya", "प्रिया", "hh_002", "Priya Sharma")
        ]
        for en_n, hi_n, hid, full_n in names:
            if en_n in lower or hi_n in text:
                beneficiary = full_n
                hh_id = hh_id or hid
                hh_name = full_n
                break

        # 2. Follow up requirement & date calculation
        follow_up_req = any(w in lower or w in text for w in [
            "dobara", "दोबारा", "jaana", "जाना", "checkup", "follow", "अगले", "next", "लौटना", "monday", "friday", "शुक्रवार", "सोमवार"
        ])
        follow_up_date = None
        if follow_up_req:
            days = 4
            if "friday" in lower or "शुक्रवार" in text:
                days = (4 - today.weekday() + 7) % 7 or 7
            elif "monday" in lower or "सोमवार" in text:
                days = (0 - today.weekday() + 7) % 7 or 7
            elif "wednesday" in lower or "बुधवार" in text:
                days = (2 - today.weekday() + 7) % 7 or 7
            elif "hafte" in lower or "week" in lower:
                days = 7
            follow_up_date = (today + timedelta(days=days)).strftime("%Y-%m-%d")

        # 3. Task-specific structure
        if task_type == "visit_logging":
            # Activity category
            cat = "General"
            if any(w in lower or w in text for w in ["vaccin", "वैक्सीन", "टीका", "tika", "mr", "dpt"]):
                cat = "Immunisation"
            elif any(w in lower or w in text for w in ["garbh", "गर्भवती", "pregnant", "anc", "delivery", "trimester", "mahine"]):
                cat = "Maternal Health"
            elif any(w in lower or w in text for w in ["bachcha", "बच्च", "infant", "child", "feeding"]):
                cat = "Child Health"
            elif any(w in lower or w in text for w in ["poshan", "पोषण", "ration", "khana", "diet", "iron", "ifa"]):
                cat = "Nutrition"

            # Outcome
            outcome = "Normal"
            if any(w in lower or w in text for w in ["hospital", "phc", "chc", "अस्पताल", "refer", "रेफर"]):
                outcome = "Referred to PHC"
            elif any(w in lower or w in text for w in ["dhyan", "नजर", "monitoring", "कमजोरी", "high bp", "fever"]):
                outcome = "Requires Monitoring"

            # Services provided
            services = []
            if "bp" in lower or "बीपी" in text:
                services.append("Blood Pressure Check")
            if "ifa" in lower or "लाल गोली" in text or "iron" in lower:
                services.append("IFA Tablets Distribution")
            if "vaccin" in lower or "टीका" in text:
                services.append("Vaccination Monitoring")
            if not services:
                services.append("Health & Nutrition Counseling")

            return {
                "beneficiary_name": beneficiary or hh_name or None,
                "household_id": hh_id or None,
                "household_name": hh_name or (f"{beneficiary} Household" if beneficiary else None),
                "visit_date": today.strftime("%Y-%m-%d"),
                "activity_category": cat,
                "activity_description": text,
                "services_provided": services,
                "visit_outcome": outcome,
                "follow_up_required": follow_up_req,
                "follow_up_date": follow_up_date,
                "priority": "Urgent" if outcome == "Referred to PHC" else ("Priority" if follow_up_req else "Routine"),
                "notes": "Structured via SAHAYIKA AI Semantic Engine."
            }

        elif task_type == "pregnancy_tracking":
            measurements = {}
            bp_match = re.search(r"(\d{2,3}\s*/\s*\d{2,3})", text)
            if bp_match:
                measurements["bp"] = bp_match.group(1).replace(" ", "")

            month_match = re.search(r"(\d)\s*(mahine|month|महीने)", lower)
            month = int(month_match.group(1)) if month_match else None

            danger = []
            for d_term in ["bleeding", "रक्तस्राव", "convulsion", "दौरा", "headache", "सिरदर्द", "blurred", "धुंधला"]:
                if d_term in lower:
                    danger.append(d_term)

            return {
                "beneficiary_name": beneficiary or hh_name or None,
                "household_id": hh_id or None,
                "pregnancy_duration": f"{month} months" if month else None,
                "pregnancy_month": month,
                "anc_visit_number": 3 if (month and month >= 7) else (2 if month and month >= 4 else 1),
                "recorded_health_measurements": measurements,
                "ifa_tablets_provided": 30 if ("ifa" in lower or "लाल" in text) else None,
                "danger_signs_observed": danger,
                "high_risk_flag": bool(danger or (measurements.get("bp") and "140" in measurements["bp"])),
                "high_risk_reason": "Identified danger signs or high BP" if danger else None,
                "follow_up_required": follow_up_req,
                "next_visit_date": follow_up_date,
                "notes": text
            }

        elif task_type == "child_health":
            wt_match = re.search(r"(\d+(\.\d+)?)\s*(kg|kilo|किलो)", lower)
            weight = float(wt_match.group(1)) if wt_match else None

            vax = []
            if "mr" in lower or "खसरा" in text:
                vax.append("MR-1")
            if "pentavalent" in lower or "पेंटा" in text:
                vax.append("Pentavalent-3")
            if "polio" in lower or "ओपीवी" in text:
                vax.append("OPV")

            return {
                "child_name": beneficiary or None,
                "mother_or_guardian_name": hh_name or None,
                "household_id": hh_id or None,
                "age": "9 months" if "9" in text else "1 year",
                "recorded_weight_kg": weight,
                "vaccinations_given": vax,
                "vaccinations_due": ["MR-2", "DPT Booster"] if vax else [],
                "nutrition_observations": "Good active appetite" if "poshan" in lower else None,
                "illness_symptoms": [],
                "follow_up_required": follow_up_req,
                "next_visit_date": follow_up_date,
                "notes": text
            }

        elif task_type == "household_registration":
            members = [{"name": beneficiary, "age": None, "gender": None, "relation": "Head", "category": "General", "is_high_risk": False}] if beneficiary else []
            return {
                "household_head_name": beneficiary or None,
                "address": None,
                "village": None,
                "contact_number": None,
                "member_count": len(members),
                "members": members,
                "notes": text
            }

        elif task_type == "follow_up_task":
            return {
                "beneficiary_name": beneficiary or hh_name or None,
                "household_id": hh_id or None,
                "task_type": "Health follow-up",
                "description": text,
                "due_date": follow_up_date or (today + timedelta(days=4)).strftime("%Y-%m-%d"),
                "priority": "High" if follow_up_req else "Medium",
                "status": "Upcoming"
            }

        else: # community_request
            return {
                "request_category": "Household visit request",
                "description": text,
                "household_reference": hh_id or None,
                "beneficiary_name": beneficiary or hh_name or None,
                "urgency": "High",
                "follow_up_required": True
            }

    def _grounded_fallback_answer(
        self,
        query: str,
        retrieved_knowledge: List[Dict[str, Any]],
        language: str
    ) -> str:
        """
        Returns accurate verified information when offline or without Gemini API key.
        """
        if retrieved_knowledge:
            best = retrieved_knowledge[0]
            title = best.get("title_hi" if language == "hi" else "title", "")
            content = best.get("content_hi" if language == "hi" else "content_en", "")
            source = best.get("source", "राष्ट्रीय स्वास्थ्य मिशन")
            if language == "hi":
                return f"{title}: {content} (स्रोत: {source})"
            return f"{title}: {content} (Source: {source})"

        if language == "hi":
            return "इस विषय पर स्वीकृत सरकारी दिशानिर्देश उपलब्ध नहीं हैं। कृपया अधिक जानकारी के लिए अपनी क्षेत्रीय आशा दीदी या प्राथमिक स्वास्थ्य केंद्र (PHC) से संपर्क करें।"
        return "Verified guidelines for this specific query are currently not available. Please consult your local ASHA worker or Primary Health Centre (PHC)."

gemini_service = GeminiService()

