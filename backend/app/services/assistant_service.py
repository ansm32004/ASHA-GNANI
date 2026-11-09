from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import re
from app.repositories.household_repository import household_repo
from app.repositories.task_repository import task_repo
from app.repositories.visit_repository import visit_repo
from app.repositories.request_repository import request_repo
from app.repositories.knowledge_base_repository import knowledge_base_repo
from app.repositories.ai_conversation_repository import ai_conversation_repo
from app.repositories.user_repository import user_repository
from app.integrations.gemini.gemini_service import gemini_service
from app.integrations.gnani.timbre import timbre_tts
from app.services.safety_service import safety_service
from app.core.logging import logger

class AssistantService:
    def __init__(self):
        pass

    async def answer_query(
        self,
        query: str,
        language: str = "hi",
        voice_enabled: bool = False,
        user_role: str = "ASHA",
        user_id: Optional[str] = None,
        household_id: Optional[str] = None
    ) -> Dict[str, Any]:
        raw_q = (query or "").strip()
        if not raw_q:
            raise ValueError("Question cannot be empty. Please provide a valid question.")

        lower_q = raw_q.lower()

        # 0. User profile resolution (for dynamic personalization, never hardcoding)
        user_name = ""
        if user_id:
            try:
                from app.services.auth_service import auth_service
                user_profile = auth_service.get_current_user_profile(user_id)
                if user_profile:
                    user_name = user_profile.get("name", "")
            except Exception as e:
                logger.warning(f"Could not load user profile for {user_id}: {e}")

        # 1. Unclear / inaudible speech check (Acceptance Test D)
        unclear_tokens = ["...", "hmm", "shh", "kya", "hello?", "?", "sound", "noise", "uh", "um"]
        if len(raw_q) < 3 or lower_q in unclear_tokens:
            if language == "hi":
                reply_text = "माफ़ कीजिए, आपकी आवाज़ स्पष्ट सुनाई नहीं दी। कृपया अपनी बात दोबारा बोलें।"
            else:
                reply_text = "I'm sorry, I could not hear you clearly. Please repeat your question."
            return await self._finalize_response(
                reply_text,
                suggested_actions=["Speak Again", "Help Topics", "Contact ASHA"],
                language=language,
                voice_enabled=voice_enabled
            )

        # 2. Clinical safety guardrails (Emergency, Prescription refusal, Out-of-scope refusal)
        safety_trigger = safety_service.pre_generation_check(lower_q, language=language)
        if safety_trigger:
            reply_text = safety_trigger["reply_text"]
            suggested_actions = safety_trigger["suggested_actions"]
            resp = await self._finalize_response(
                reply_text,
                suggested_actions,
                language=language,
                voice_enabled=voice_enabled
            )
            resp["safety_disclaimer"] = "Clinical safety guardrail applied."
            self._log_audit(query, reply_text, user_id, household_id, language, safety_trigger.get("level", "Safety Intervention"), resp.get("audio_url"))
            return resp

        # 3. Dynamic Greeting Intent (Acceptance Test A)
        greeting_words = ["namaste", "नमस्ते", "hello", "हेलो", "hi", "हैलो", "pranam", "प्रणाम", "suprabhat", "सुप्रभात"]
        is_pure_greeting = (
            lower_q in greeting_words
            or any(lower_q == f"{w} sahayika" or lower_q == f"{w} didi" or lower_q == f"{w} ji" for w in greeting_words)
            or lower_q in ["kaisa hai", "kaise ho", "how are you"]
        )
        if is_pure_greeting:
            if user_role == "ASHA":
                name_part = f"{user_name} जी" if user_name else "आशा दीदी"
                if language == "hi":
                    reply_text = f"नमस्ते {name_part}! आज मैं आपकी फील्ड विजिट, फॉलो-अप टास्क या स्वास्थ्य नियमों में कैसे सहायता कर सकती हूँ?"
                else:
                    reply_text = f"Hello {user_name or 'Sister'}! How can I assist you with your field visits, follow-up tasks, or health guidelines today?"
                suggested_actions = ["Today's Schedule", "Record Field Visit", "Ask Health Question"]
            else:
                name_part = f"{user_name} जी" if user_name else ""
                if language == "hi":
                    reply_text = f"नमस्ते {name_part}! सहायिका में आपका स्वागत है। आप अपने परिवार के स्वास्थ्य, शिशु देखभाल, टीकाकरण या सरकारी योजनाओं की जानकारी ले सकते हैं।"
                else:
                    reply_text = f"Hello {user_name}! Welcome to SAHAYIKA. You can ask about your family's health, child immunization, or government health schemes."
                suggested_actions = ["Child Immunisation", "Pregnancy Care", "Govt Schemes (JSY)"]

            resp = await self._finalize_response(reply_text, suggested_actions, language=language, voice_enabled=voice_enabled)
            self._log_audit(query, reply_text, user_id, household_id, language, "Greeting Intent", resp.get("audio_url"))
            return resp

        # 4. ASHA Operational Task Scheduling Intent (Acceptance Test E)
        # E.g. "Meena Devi ke ghar Friday ko blood pressure check karna hai"
        schedule_action_keywords = [
            "karna hai", "schedule karo", "schedule karna", "task banao", "याद दिलाना",
            "चेक करना है", "शेड्यूल करो", "शेड्यूल करना है", "विजिट जोड़ें", "टास्क जोड़ो",
            "टास्क बनाओ", "create task", "add task", "task add"
        ]
        is_query_for_schedule = any(q in lower_q for q in ["kya hai", "what is", "batao", "dikhao", "show", "list", "कौन", "क्या"])
        is_task_instruction = (
            user_role == "ASHA"
            and not is_query_for_schedule
            and any(k in lower_q for k in schedule_action_keywords)
            and any(w in lower_q for w in ["ghar", "home", "check", "visit", "bp", "blood pressure", "tika", "friday", "शुक्रवार", "monday", "सोमवार", "kal", "tomorrow"])
        )

        if is_task_instruction:
            try:
                extracted = await gemini_service.extract_structured_fields(
                    transcript=raw_q,
                    task_type="follow_up_task",
                    language=language
                )
                beneficiary = extracted.get("beneficiary_name") or ""
                task_desc = extracted.get("description") or extracted.get("task_type") or "Health follow-up"
                due_date = extracted.get("due_date") or (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")

                # Try resolving household in ASHA's territory
                target_hh = None
                if beneficiary:
                    candidates = household_repo.list_all(search=beneficiary, assigned_asha_id=user_id)
                    if not candidates:
                        candidates = household_repo.list_all(search=beneficiary)
                    if candidates:
                        target_hh = candidates[0]

                hh_id_val = target_hh.get("id") if target_hh else (extracted.get("household_id") or "hh_general")
                hh_name_val = target_hh.get("primary_contact_name") if target_hh else (beneficiary or "Beneficiary Household")

                # Create real task in task repository
                created_task = task_repo.create({
                    "household_id": hh_id_val,
                    "household_name": hh_name_val,
                    "beneficiary_name": beneficiary or hh_name_val,
                    "assigned_asha_id": user_id or "asha_sunita_001",
                    "task_type": extracted.get("task_type", "Health Follow-up"),
                    "description": task_desc,
                    "due_date": due_date,
                    "priority": extracted.get("priority", "Medium"),
                    "created_from": "Voice Assistant"
                })

                if language == "hi":
                    reply_text = f"{hh_name_val} के लिए {due_date} को '{task_desc}' का टास्क सफलतापूर्वक शेड्यूल कर दिया गया है।"
                else:
                    reply_text = f"Task for '{task_desc}' at {hh_name_val} on {due_date} has been scheduled successfully."

                suggested_actions = ["View Task List", "Record Visit", "Set Reminder"]
                resp = await self._finalize_response(
                    reply_text,
                    suggested_actions,
                    referenced_tasks=[created_task],
                    language=language,
                    voice_enabled=voice_enabled
                )
                self._log_audit(query, reply_text, user_id, household_id, language, "Task Created", resp.get("audio_url"))
                return resp
            except Exception as e:
                logger.error(f"Error handling voice task scheduling: {e}")

        # 5. Operational Status Queries: Today's visits / Pending follow-ups (Acceptance Test F)
        is_today_query = any(w in lower_q for w in [
            "aaj", "today", "aaj ka", "aaj ke", "aaj ki", "kin gharon", "today's",
            "आज", "किन घरों", "आज का", "आज के", "आज की", "आज कौन", "आज मुझे"
        ])
        is_upcoming_query = any(w in lower_q for w in [
            "kal", "tomorrow", "pending", "follow-up", "follow up", "फॉलो-अप", "aane wale",
            "कल", "लंबित", "आने वाले", "आगे के"
        ])

        today_action_keywords = [
            "visit", "task", "schedule", "जाना", "काम", "visiting", "विजिट",
            "घर", "घरों", "शेड्यूल", "देखना", "जाना है", "राउंड", "सूची", "list"
        ]
        is_kin_gharon = any(w in lower_q for w in ["kin gharon", "किन घरों", "कौन से घर", "कौन-से घर", "kis ghar"])

        if (is_today_query and any(w in lower_q for w in today_action_keywords)) or is_kin_gharon:
            today_str = datetime.now().strftime("%Y-%m-%d")
            all_user_tasks = task_repo.list_all(assigned_asha_id=user_id if user_role == "ASHA" else None, household_id=household_id if user_role == "COMMUNITY" else None)
            today_tasks = [t for t in all_user_tasks if t.get("status") == "Due today" or t.get("due_date") == today_str]
            if not today_tasks:
                today_tasks = [t for t in all_user_tasks if t.get("status") in ["Due today", "Upcoming"] and t.get("due_date") == today_str]

            if today_tasks:
                task_summaries = [f"{t.get('household_name', 'Household')} ({t.get('task_type', 'Visit')})" for t in today_tasks[:3]]
                summary_str = ", ".join(task_summaries)
                if language == "hi":
                    reply_text = f"आज आपके पास {len(today_tasks)} महत्वपूर्ण विजिट हैं: {summary_str}।"
                else:
                    reply_text = f"You have {len(today_tasks)} scheduled visits for today: {summary_str}."
                suggested_actions = ["Record Visit", "View Today's Tasks", "Open Navigation"]
            else:
                if language == "hi":
                    reply_text = "आज के लिए आपका कोई निर्धारित फील्ड विजिट या कार्य लंबित नहीं है। आप नया विजिट रिकॉर्ड कर सकते हैं या नया परिवार जोड़ सकते हैं।"
                else:
                    reply_text = "You have no field visits scheduled for today. You can record a new visit or register a household."
                suggested_actions = ["Record Visit", "Add Household", "View All Tasks"]

            resp = await self._finalize_response(reply_text, suggested_actions, referenced_tasks=today_tasks, language=language, voice_enabled=voice_enabled)
            self._log_audit(query, reply_text, user_id, household_id, language, "Operational Schedule", resp.get("audio_url"))
            return resp

        elif is_upcoming_query and any(w in lower_q for w in ["visit", "task", "pending", "लंबित", "फॉलो", "काम", "schedule", "विजिट", "जाना"]):
            today_str = datetime.now().strftime("%Y-%m-%d")
            all_user_tasks = task_repo.list_all(assigned_asha_id=user_id if user_role == "ASHA" else None, household_id=household_id if user_role == "COMMUNITY" else None)
            upcoming = [t for t in all_user_tasks if t.get("status") in ["Upcoming", "Overdue"] or (t.get("due_date") and t.get("due_date") > today_str)][:3]

            if upcoming:
                task_summaries = [f"{t.get('household_name', 'Household')} ({t.get('task_type', 'Follow-up')})" for t in upcoming]
                summary_str = ", ".join(task_summaries)
                if language == "hi":
                    reply_text = f"आपके आने वाले दिनों में {len(upcoming)} फॉलो-अप लंबित हैं: {summary_str}।"
                else:
                    reply_text = f"You have {len(upcoming)} upcoming follow-ups: {summary_str}."
                suggested_actions = ["View Task List", "Set Reminder"]
            else:
                if language == "hi":
                    reply_text = "वर्तमान में आपके कोई फॉलो-अप कार्य लंबित नहीं हैं।"
                else:
                    reply_text = "You currently have no pending follow-up tasks."
                suggested_actions = ["Create Task", "Household List"]

            resp = await self._finalize_response(reply_text, suggested_actions, referenced_tasks=upcoming, language=language, voice_enabled=voice_enabled)
            self._log_audit(query, reply_text, user_id, household_id, language, "Upcoming Follow-ups", resp.get("audio_url"))
            return resp

        # 6. Gather Relevant Patient, Household, Visit, Vaccination & Task Context
        app_context, matched_hhs, matched_tasks = self._build_app_context(
            query=raw_q,
            user_id=user_id,
            user_role=user_role,
            household_id=household_id
        )

        # 7. Grounded Clinical, Medical, Scheme & Health Q&A with Gemini
        # Retrieve approved verified records from Firestore Knowledge Base
        retrieved_docs = knowledge_base_repo.list_approved(query=raw_q, limit=3)

        generated_reply = await gemini_service.answer_health_query(
            query=raw_q,
            retrieved_knowledge=retrieved_docs,
            language=language,
            user_role=user_role,
            app_context=app_context
        )

        reply_text = safety_service.post_generation_check(generated_reply, language=language)

        suggested_actions = ["Ask Another Question", "View Health Guidelines", "Contact Village ASHA"]
        if any(w in lower_q for w in ["bukhar", "fever", "बुखार", "temperature"]):
            suggested_actions = ["Fever Home Care Rules", "Nearest PHC Centre", "Contact ASHA Worker"]
        elif any(w in lower_q for w in ["vaccin", "tika", "टीका", "vaccination"]):
            suggested_actions = ["Full Immunisation Chart", "Next Anganwadi Camp", "Contact ANM"]
        elif any(w in lower_q for w in ["poshan", "diet", "पोषण", "ration", "राशन"]):
            suggested_actions = ["Anganwadi Ration Rules", "Nutrition Diet Guide", "IFA Tablet Schedule"]
        elif any(w in lower_q for w in ["scheme", "jsy", "pmmvy", "योजना", "पैसे", "1400", "5000"]):
            suggested_actions = ["JSY Delivery Benefit", "PMMVY Registration", "Ayushman Card"]
        elif matched_hhs:
            name = matched_hhs[0].get("primary_contact_name", "Beneficiary")
            suggested_actions = [f"View {name}'s Profile", "Record Visit", "Set Reminder"]

        resp = await self._finalize_response(
            reply_text,
            suggested_actions,
            referenced_households=matched_hhs,
            referenced_tasks=matched_tasks,
            language=language,
            voice_enabled=voice_enabled
        )
        self._log_audit(query, reply_text, user_id, household_id, language, "Grounded Health Guidance", resp.get("audio_url"))
        return resp

    def _build_app_context(
        self,
        query: str,
        user_id: Optional[str] = None,
        user_role: str = "ASHA",
        household_id: Optional[str] = None
    ) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Extract relevant app context (beneficiary, household, saved visits, vaccinations, pregnancy/ANC/PNC, tasks).
        """
        lower_q = (query or "").lower()
        matched_hhs: List[Dict[str, Any]] = []
        matched_tasks: List[Dict[str, Any]] = []

        all_hhs = household_repo.list_all(assigned_asha_id=user_id if user_role == "ASHA" else None)
        if not all_hhs:
            all_hhs = household_repo.list_all()

        target_hh = None
        if household_id:
            for hh in all_hhs:
                if hh.get("id") == household_id or hh.get("household_id") == household_id:
                    target_hh = hh
                    break

        if not target_hh:
            for hh in all_hhs:
                head_name = (hh.get("primary_contact_name") or "").lower()
                if head_name and head_name in lower_q:
                    target_hh = hh
                    break
                for m in hh.get("members", []):
                    m_name = (m.get("name") or "").lower()
                    if m_name and (m_name in lower_q or any(part in lower_q for part in m_name.split() if len(part) > 3)):
                        target_hh = hh
                        break
                if target_hh:
                    break

        context_lines = []
        if target_hh:
            matched_hhs.append(target_hh)
            hh_id = target_hh.get("id") or target_hh.get("household_id")
            context_lines.append(f"Household: {target_hh.get('primary_contact_name', 'Unknown')} (ID: {hh_id}, Village: {target_hh.get('village', 'Unknown')}, Priority: {target_hh.get('priority', 'Routine')})")

            # Members details
            members = target_hh.get("members", [])
            for m in members:
                m_info = f"- Member: {m.get('name')} | Relation: {m.get('relation')} | Age: {m.get('age')} | Gender: {m.get('gender')} | Category: {m.get('category', 'General')}"
                if m.get("status"):
                    m_info += f" | Pregnancy/Health Status: {m.get('status')}"
                if m.get("pregnancy_month"):
                    m_info += f" | Pregnancy Month: {m.get('pregnancy_month')} (3rd trimester)"
                if m.get("expected_delivery_date"):
                    m_info += f" | Expected Delivery Date (EDD): {m.get('expected_delivery_date')}"
                if m.get("high_risk_reason"):
                    m_info += f" | High Risk Note: {m.get('high_risk_reason')}"
                if m.get("next_due_vaccine"):
                    m_info += f" | Next Due Vaccine: {m.get('next_due_vaccine')}"
                if m.get("next_checkup"):
                    m_info += f" | Next Checkup: {m.get('next_checkup')}"
                if m.get("next_vaccine"):
                    m_info += f" | Next Vaccine: {m.get('next_vaccine')}"
                if m.get("doctor_notes"):
                    m_info += f" | Doctor Notes: {m.get('doctor_notes')}"
                context_lines.append(m_info)

                # Vitals
                vitals = m.get("vitals", [])
                if vitals:
                    v_summaries = [f"(Date: {v.get('date')}, BP: {v.get('bp', 'N/A')}, Weight: {v.get('weight', 'N/A')}, Hb: {v.get('hb', 'N/A')})" for v in vitals[:2]]
                    context_lines.append(f"  Vitals: {', '.join(v_summaries)}")

                # Immunizations
                immunizations = m.get("immunizations", [])
                if immunizations:
                    imm_summaries = [f"{im.get('vaccine')} ({im.get('status')}, {im.get('date', 'N/A')})" for im in immunizations]
                    context_lines.append(f"  Vaccinations: {', '.join(imm_summaries)}")

            # Saved visits for this household
            if hh_id:
                past_visits = visit_repo.list_all(household_id=hh_id)
                if past_visits:
                    v_strs = []
                    for v in past_visits[:3]:
                        v_strs.append(f"[Visit Date: {v.get('visit_date')}, Category: {v.get('activity_category')}, Outcome: {v.get('visit_outcome')}, Notes: {v.get('activity_description', '')[:60]}]")
                    context_lines.append("Saved Past Visits:\n" + "\n".join(v_strs))

            # Saved tasks for this household
            if hh_id:
                hh_tasks = task_repo.list_all(household_id=hh_id)
                if hh_tasks:
                    matched_tasks.extend(hh_tasks)
                    t_strs = [f"- Task: {t.get('task_type')} | Description: {t.get('description')} | Due: {t.get('due_date')} | Priority: {t.get('priority')} | Status: {t.get('status')}" for t in hh_tasks[:3]]
                    context_lines.append("Household Follow-up Tasks:\n" + "\n".join(t_strs))

        # Also include today's tasks if ASHA worker and no specific household context
        if not context_lines and user_role == "ASHA":
            today_str = datetime.now().strftime("%Y-%m-%d")
            all_user_tasks = task_repo.list_all(assigned_asha_id=user_id)
            today_tasks = [t for t in all_user_tasks if t.get("status") == "Due today" or t.get("due_date") == today_str]
            if today_tasks:
                matched_tasks.extend(today_tasks)
                t_strs = [f"- {t.get('household_name')}: {t.get('task_type')} ({t.get('description')})" for t in today_tasks[:3]]
                context_lines.append("Today's Tasks:\n" + "\n".join(t_strs))

        context_str = "\n".join(context_lines) if context_lines else ""
        return context_str, matched_hhs, matched_tasks

    def _log_audit(
        self,
        query: str,
        reply_text: str,
        user_id: Optional[str],
        household_id: Optional[str],
        language: str,
        safety_level: str,
        audio_url: Optional[str]
    ) -> None:
        try:
            ai_conversation_repo.log_interaction(
                query=query,
                response_text=reply_text,
                user_id=user_id,
                household_id=household_id,
                language=language,
                task_type="assistant_query",
                safety_level=safety_level,
                audio_url=audio_url
            )
        except Exception as e:
            logger.warning(f"Could not log AI interaction: {e}")

    async def _finalize_response(
        self,
        reply_text: str,
        suggested_actions: List[str],
        referenced_households: Optional[List[Dict[str, Any]]] = None,
        referenced_tasks: Optional[List[Dict[str, Any]]] = None,
        language: str = "hi",
        voice_enabled: bool = False
    ) -> Dict[str, Any]:
        audio_url = None
        if reply_text:
            # 1. Fast path: check local audio cache (0ms)
            cached = timbre_tts.get_cached_audio_url(reply_text, language=language)
            if cached:
                audio_url = cached
            elif voice_enabled:
                # 2. Synthesize the exact spoken words for this reply text
                try:
                    tts_res = await timbre_tts.speak(reply_text, language=language)
                    if tts_res and tts_res.get("audio_url"):
                        audio_url = tts_res.get("audio_url")
                except Exception as tts_err:
                    logger.warning(f"Error synthesizing speech for reply: {tts_err}")

        return {
            "reply_text": reply_text,
            "audio_url": audio_url,
            "suggested_actions": suggested_actions,
            "referenced_households": referenced_households or [],
            "referenced_tasks": referenced_tasks or [],
            "model_used": getattr(gemini_service, "last_used_model", "semantic-rule-engine"),
            "safety_disclaimer": "SAHAYIKA provides approved health information and operational guidance. It does not replace medical consultation with a qualified doctor or MO."
        }

assistant_service = AssistantService()
