from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.repositories.household_repository import household_repo
from app.repositories.task_repository import task_repo
from app.repositories.request_repository import request_repo
from app.integrations.gnani.timbre import timbre_tts
from app.core.logging import logger

class AssistantService:
    def __init__(self):
        pass

    async def answer_query(
        self,
        query: str,
        language: str = "hi",
        voice_enabled: bool = False
    ) -> Dict[str, Any]:
        q = query.lower().strip()
        
        reply_text = ""
        suggested_actions: List[str] = []
        referenced_households: List[Dict[str, Any]] = []
        referenced_tasks: List[Dict[str, Any]] = []

        # 1. "Mujhe aaj kin gharon mein jaana hai?" / Today's visits query
        if any(w in q for w in ["aaj", "today", "kin gharon", "visits", "visit", "जाना"]):
            today_tasks = task_repo.list_all(status="Due today")
            if not today_tasks:
                today_tasks = [t for t in task_repo.list_all() if t["status"] in ["Due today", "Upcoming"]][:3]
            
            referenced_tasks = today_tasks
            task_names = [f"{t['household_name']} ({t['task_type']})" for t in today_tasks]
            
            if language == "hi":
                reply_text = (
                    f"नमस्ते सुनीता जी! आज आपके पास {len(today_tasks)} महत्वपूर्ण विजिट हैं: "
                    + ", ".join(task_names)
                    + "। सबसे पहले मीना देवी के घर जाना प्राथमिकता है।"
                )
            else:
                reply_text = (
                    f"Hello Sunita ji! You have {len(today_tasks)} priority visits scheduled for today: "
                    + ", ".join(task_names)
                    + ". Visiting Meena Devi is the top priority."
                )
            suggested_actions = ["Record Visit", "View Today's Tasks", "Open Navigation"]

        # 2. "Kal ke pending follow-ups dikhao" / Tomorrow / pending tasks
        elif any(w in q for w in ["kal", "tomorrow", "pending", "follow-up", "follow up", "फॉलो-अप"]):
            upcoming_tasks = [t for t in task_repo.list_all() if t["status"] in ["Upcoming", "Overdue"]][:3]
            referenced_tasks = upcoming_tasks
            
            if language == "hi":
                reply_text = (
                    f"आपके आने वाले दिनों में {len(upcoming_tasks)} फॉलो-अप लंबित हैं। "
                    "इनमें रेखा शर्मा (शिशु स्वास्थ्य) और कमला यादव (एनसीडी स्क्रीनिंग) शामिल हैं।"
                )
            else:
                reply_text = (
                    f"You have {len(upcoming_tasks)} pending follow-ups coming up. "
                    "These include Rekha Sharma (Child Health) and Kamla Yadav (NCD Screening)."
                )
            suggested_actions = ["View Task List", "Set Reminder"]

        # 3. "Vaccination camp kab hai?" / VHSND query
        elif any(w in q for w in ["vaccin", "camp", "vhsnd", "टीका", "कैंप", "सत्र"]):
            if language == "hi":
                reply_text = (
                    "अगला ग्राम स्वास्थ्य स्वच्छता एवं पोषण दिवस (VHSND) सत्र इसी बुधवार को आंगनवाड़ी केंद्र 2 पर है। "
                    "इस सत्र में 0-1 वर्ष के 6 बच्चों के पेंटावेलेंट और एमआर-1 टीके लगने हैं।"
                )
            else:
                reply_text = (
                    "The next Village Health, Sanitation and Nutrition Day (VHSND) session is scheduled for this Wednesday at Anganwadi Centre 2. "
                    "6 infants are due for Pentavalent and MR-1 immunisation."
                )
            suggested_actions = ["View Due Immunisation List", "Notify Families"]

        # 4. "Meena Devi ka last follow-up kab hua tha?" / Specific household query
        elif any(w in q for w in ["meena", "मीना", "devi"]):
            hh = household_repo.get_by_id("hh_001")
            if hh:
                referenced_households = [hh]
                if language == "hi":
                    reply_text = (
                        f"मीना देवी का पिछला फॉलो-अप {hh.get('last_visit_date')} को हुआ था। "
                        "वे 7वें महीने की गर्भवती हैं और उच्च जोखिम (एनीमिया) श्रेणी में हैं। अगला फॉलो-अप आज देय है।"
                    )
                else:
                    reply_text = (
                        f"Meena Devi's last follow-up visit was on {hh.get('last_visit_date')}. "
                        "She is in her 7th month of pregnancy and flagged for mild anaemia. Follow-up is due today."
                    )
                suggested_actions = ["Open Meena Devi Profile", "Record Visit Now", "Call Beneficiary"]

        # 5. "Nutrition programme ke baare mein batao" / Government health scheme
        elif any(w in q for w in ["nutrition", "poshan", "पोषण", "ration", "jsy", "pmvvy", "योजना"]):
            if language == "hi":
                reply_text = (
                    "पोषण अभियान (POSHAN) के तहत गर्भवती और धात्री महिलाओं को आंगनवाड़ी से पूरक पोषाहार (THR) मिलता है। "
                    "साथ ही जननी सुरक्षा योजना (JSY) के तहत संस्थागत प्रसव पर ग्रामीण क्षेत्र में ₹1,400 की वित्तीय सहायता मिलती है।"
                )
            else:
                reply_text = (
                    "Under POSHAN Abhiyaan, pregnant women and lactating mothers receive Take-Home Ration (THR) from the Anganwadi centre. "
                    "Under Janani Suraksha Yojana (JSY), institutional delivery entitles rural mothers to financial assistance of ₹1,400."
                )
            suggested_actions = ["Explain JSY Rules", "View Eligible Beneficiaries"]

        # 6. Medical safety guardrail query (e.g. asking for medicine / diagnosis)
        elif any(w in q for w in ["dawa", "medicine", "tablet", "bimar", "treatment", "cure", "इलाज", "दवा"]):
            if language == "hi":
                reply_text = (
                    "सुरक्षा सूचना: सहायिका एआई निदान या दवा की सलाह नहीं दे सकती। "
                    "कृपया किसी भी स्वास्थ्य समस्या के लिए पीएचसी चिकित्सा अधिकारी (MO) या एएनएम दीदी से परामर्श लें। "
                    "आपातकालीन स्थिति में तुरंत 108 या 112 डायल करें।"
                )
            else:
                reply_text = (
                    "Safety Note: SAHAYIKA AI Assistant cannot diagnose conditions or prescribe medications. "
                    "Please consult the Primary Health Centre Medical Officer (MO) or ANM. "
                    "In case of emergency, immediately dial 108 or 112."
                )
            suggested_actions = ["Call PHC Helpline", "Trigger Emergency SOS"]

        # Default helpful assistant reply
        else:
            if language == "hi":
                reply_text = (
                    f"सुनीता जी, मैं आपके क्षेत्र (रामपुर कलां) के 34 परिवारों, आज के विजिट और स्वास्थ्य योजनाओं की जानकारी दे सकती हूँ। "
                    "आप मुझसे आज के विजिट, टीकाकरण कैंप या किसी परिवार के बारे में पूछ सकती हैं।"
                )
            else:
                reply_text = (
                    f"Sunita ji, I can help you with your 34 assigned households in Rampur Kalan, today's visit schedule, or government health schemes. "
                    "Try asking 'What visits do I have today?' or 'When is the next vaccination camp?'"
                )
            suggested_actions = ["Today's Visits", "Vaccination Schedule", "Community Requests"]

        tts_data = None
        if voice_enabled:
            tts_data = await timbre_tts.speak(reply_text, language=language)

        return {
            "reply_text": reply_text,
            "audio_url": tts_data.get("audio_url") if tts_data else None,
            "suggested_actions": suggested_actions,
            "referenced_households": referenced_households,
            "referenced_tasks": referenced_tasks,
            "safety_disclaimer": "SAHAYIKA AI Assistant provides operational guidance and approved government scheme information. It never diagnoses diseases or prescribes treatment. Always consult MO/ANM for medical emergencies."
        }

assistant_service = AssistantService()

