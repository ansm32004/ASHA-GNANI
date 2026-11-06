from typing import List, Optional, Dict, Any
from app.integrations.firebase.firestore_repository import FirestoreRepository
from app.core.logging import logger
import re

VERIFIED_KNOWLEDGE_RECORDS: List[Dict[str, Any]] = [
    # 1. Maternal Health
    {
        "id": "kb_mat_001",
        "category": "maternal_health",
        "subcategory": "anc_schedule",
        "title": "Antenatal Care (ANC) Visits Schedule",
        "title_hi": "प्रसव पूर्व जांच (ANC) का समय-सारणी",
        "content_en": "Every pregnant woman must complete at least 4 ANC visits: 1st visit within 12 weeks of pregnancy; 2nd visit between 14-26 weeks; 3rd visit between 28-34 weeks; 4th visit between 36 weeks and delivery. Blood pressure, weight, abdominal checkup, and hemoglobin testing are performed at every visit.",
        "content_hi": "प्रत्येक गर्भवती महिला को कम से कम 4 एएनसी (ANC) जांच जरूर करवानी चाहिए: पहली जांच 12वें हफ्ते के अंदर, दूसरी 14-26वें हफ्ते में, तीसरी 28-34वें हफ्ते में, और चौथी 36वें हफ्ते से प्रसव तक। हर जांच में बीपी, वजन, पेट की जांच और हीमोग्लोबिन टेस्ट होता है।",
        "keywords": ["anc", "checkup", "pregnancy", "trimester", "bp", "hemoglobin", "जांच", "गर्भावस्था", "विजिट"],
        "source": "MoHFW ANC Guidelines",
        "verified_by": "National Health Mission",
        "status": "Approved"
    },
    {
        "id": "kb_mat_002",
        "category": "maternal_health",
        "subcategory": "ifa_supplementation",
        "title": "Iron and Folic Acid (IFA) Tablets During Pregnancy",
        "title_hi": "गर्भावस्था में आयरन और फोलिक एसिड (IFA) लाल गोलियां",
        "content_en": "Pregnant women must take 1 Red IFA tablet daily for at least 180 days starting after the first trimester (from 14th week). Do not take IFA with tea or coffee; take it after meals with lemon water or clean water. Calcium tablets must be taken at a different time, never together with IFA.",
        "content_hi": "गर्भवती महिला को दूसरे ट्राइमेस्टर (14वें हफ्ते के बाद) से रोजाना 1 लाल आईएफए (आयरन) गोली कम से कम 180 दिनों तक खानी चाहिए। गोली को चाय या कॉफी के साथ न लें, नींबू पानी या सादे पानी के साथ लें। कैल्शियम की गोली आयरन के साथ न खाएं, अलग समय पर लें।",
        "keywords": ["ifa", "iron", "folic acid", "tablets", "anaemia", "लाल गोली", "आयरन", "खून की कमी"],
        "source": "Anaemia Mukt Bharat",
        "verified_by": "National Health Mission",
        "status": "Approved"
    },
    {
        "id": "kb_mat_003",
        "category": "maternal_health",
        "subcategory": "danger_signs",
        "title": "Danger Signs During Pregnancy Requiring Urgent Hospital Care",
        "title_hi": "गर्भावस्था के खतरे के लक्षण (तत्काल अस्पताल जाएं)",
        "content_en": "Immediate danger signs during pregnancy include: vaginal bleeding, convulsions or seizures, severe headache with blurred vision, high fever with chills, severe abdominal pain, breathlessness, and absence of fetal movement. If any of these occur, immediately call 112/108 or take the woman to the nearest PHC/CHC.",
        "content_hi": "गर्भावस्था के गंभीर खतरे के लक्षण: योनि से रक्तस्राव (ब्लीडिंग), दौरे पड़ना, तेज सिरदर्द के साथ धुंधला दिखना, तेज बुखार, पेट में असहनीय दर्द, सांस लेने में तकलीफ, या बच्चे की हलचल बंद होना। ऐसा होने पर तुरंत 112 या 108 डायल करें और नजदीकी पीएचसी/सीएचसी ले जाएं।",
        "keywords": ["danger", "bleeding", "convulsion", "seizure", "emergency", "urgent", "खतरा", "रक्तस्राव", "दौरे", "आपातकालीन"],
        "source": "NHM Emergency Obstetric Care Guidelines",
        "verified_by": "National Health Mission",
        "status": "Approved"
    },

    {
        "id": "kb_ill_001",
        "category": "common_illness",
        "subcategory": "fever_management",
        "title": "MoHFW Guidelines for Fever and Safe Home Care",
        "title_hi": "बुखार की देखभाल और सुरक्षित प्राथमिक दिशानिर्देश (MoHFW)",
        "content_en": "For fever: ensure plenty of fluids (boiled water, dal water, ORS) and complete bed rest in a well-ventilated room. Sponge forehead and body with normal room-temperature water (do not use ice or cold water). Do NOT take antibiotics or unprescribed medicines without a doctor's examination. Danger signs: high fever for >3 days, convulsions/fits, breathing difficulty, severe rash, or extreme lethargy—immediately visit the nearest PHC or consult ASHA/ANM.",
        "content_hi": "बुखार होने पर: पर्याप्त मात्रा में तरल पदार्थ (उबला पानी, दाल का पानी, ओआरएस) पिएं और हवादार कमरे में पूरा आराम करें। सामान्य पानी से माथे व शरीर पर गीली पट्टी (स्पंजिंग) करें (बर्फ या ठंडे पानी का इस्तेमाल न करें)। बिना डॉक्टर की सलाह कोई भी एंटीबायोटिक या खुद से दवा न लें। खतरे के लक्षण: 3 दिन से अधिक तेज बुखार, दौरे पड़ना, सांस फूलना, चकत्ते निकलना या अत्यधिक सुस्ती—तुरंत नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) जाएं या आशा दीदी से संपर्क करें।",
        "keywords": ["fever", "bukhar", "temperature", "chills", "sponge", "danger signs", "बुखार", "तापमान", "ठंड", "पट्टी", "सुस्ती", "तबीयत"],
        "source": "MoHFW Primary Healthcare Standard Treatment Guidelines",
        "verified_by": "National Health Mission",
        "status": "Approved"
    },

    # 2. Child Health & Immunisation
    {
        "id": "kb_ch_001",
        "category": "child_health",
        "subcategory": "immunisation_schedule",
        "title": "National Child Immunisation Schedule",
        "title_hi": "राष्ट्रीय बाल टीकाकरण समय-सारणी",
        "content_en": "Birth: BCG, OPV-0, Hepatitis B; 6, 10, 14 weeks: Pentavalent (DPT+HepB+Hib), Rotavirus, OPV, fIPV, PCV; 9-12 months: MR-1 (Measles-Rubella), JE-1, PCV Booster, Vitamin A; 16-24 months: MR-2, DPT Booster-1, OPV Booster; 5-6 years: DPT Booster-2. All vaccinations are completely free at Anganwadi and PHC.",
        "content_hi": "जन्म पर: बीसीजी (BCG), ओपीवी-0 (OPV-0), हेपेटाइटिस-बी; 6, 10, 14 हफ्ते पर: पेंटावेलेंट, रोटावायरस, ओपीवी, एफ-आईपेवी, पीसीवी; 9-12 महीने पर: एमआर-1 (खसरा-रूबेला), जेई-1, पीसीवी बूस्टर, विटामिन ए; 16-24 महीने पर: एमआर-2, डीपीटी बूस्टर-1; 5-6 साल पर: डीपीटी बूस्टर-2। सभी टीके आंगनवाड़ी और पीएचसी पर मुफ्त लगते हैं।",
        "keywords": ["vaccine", "vaccination", "tika", "bcg", "pentavalent", "mr", "dpt", "polio", "टीका", "टीकाकरण", "वैक्सीन"],
        "source": "Universal Immunization Programme (UIP)",
        "verified_by": "Ministry of Health & Family Welfare",
        "status": "Approved"
    },
    {
        "id": "kb_ch_002",
        "category": "child_health",
        "subcategory": "diarrhea_management",
        "title": "Management of Childhood Diarrhea with ORS and Zinc",
        "title_hi": "बच्चों में दस्त का उपचार: ओआरएस (ORS) और जिंक",
        "content_en": "During diarrhea in children, immediately give ORS solution to prevent dehydration. Mix 1 packet of ORS in 1 litre of clean drinking water. Give small sips after every loose stool. Continue Zinc tablets for 14 full days (10mg/day for infants under 6 months; 20mg/day for children 6 months and older). Continue breastfeeding and home liquids.",
        "content_hi": "दस्त होने पर तुरंत ओआरएस (ORS) का घोल दें। 1 पैकेट ओआरएस को 1 लीटर साफ पीने के पानी में घोलें। हर दस्त के बाद थोड़ा-थोड़ा पिलाएं। जिंक की गोली पूरे 14 दिनों तक रोजाना दें (6 महीने से छोटे बच्चे को 10 मि.ग्रा., 6 महीने से बड़े को 20 मि.ग्रा.)। स्तनपान जारी रखें।",
        "keywords": ["diarrhea", "loose motion", "ors", "zinc", "dehydration", "दस्त", "ओआरएस", "जिंक", "पानी की कमी"],
        "source": "Stop Diarrhea Initiative, MoHFW",
        "verified_by": "National Health Mission",
        "status": "Approved"
    },

    # 3. Nutrition
    {
        "id": "kb_nut_001",
        "category": "nutrition",
        "subcategory": "poshan_abhiyaan",
        "title": "POSHAN Abhiyaan and Anganwadi Nutrition Support",
        "title_hi": "पोषण अभियान एवं आंगनवाड़ी पूरक पोषाहार",
        "content_en": "Under POSHAN Abhiyaan, pregnant women, nursing mothers, and children aged 6 months to 6 years receive Take-Home Ration (THR) from Anganwadi Centres. Pregnant women should eat an extra meal daily with green leafy vegetables, lentils (dal), milk, eggs, and seasonal fruits to ensure adequate maternal and fetal nutrition.",
        "content_hi": "पोषण अभियान के तहत गर्भवती महिलाओं, धात्री माताओं और 6 माह से 6 वर्ष के बच्चों को आंगनवाड़ी केंद्र से मुफ्त पूरक पोषाहार (टेक होम राशन - THR) मिलता है। गर्भवती महिलाओं को रोजाना हरी पत्तेदार सब्जियां, दाल, दूध, अंडे और मौसमी फल खाने चाहिए ताकि मां और बच्चे दोनों को पोषण मिले।",
        "keywords": ["poshan", "nutrition", "thr", "ration", "diet", "anganwadi", "पोषण", "राशन", "आहार", "आंगनवाड़ी", "खाना"],
        "source": "POSHAN Abhiyaan, Ministry of WCD",
        "verified_by": "Ministry of Women & Child Development",
        "status": "Approved"
    },
    {
        "id": "kb_nut_002",
        "category": "nutrition",
        "subcategory": "infant_feeding",
        "title": "Exclusive Breastfeeding and Complementary Feeding",
        "title_hi": "शिशु आहार: 6 महीने तक केवल स्तनपान एवं ऊपरी आहार",
        "content_en": "Start breastfeeding within 1 hour of birth (first yellow milk - colostrum is child's first vaccine). Give ONLY breast milk for the first 6 months - no water, honey, or animal milk. At completed 6 months, begin semi-solid complementary feeding (mashed khichdi, dalia, vegetables) while continuing breastfeeding up to 2 years.",
        "content_hi": "जन्म के 1 घंटे के भीतर स्तनपान शुरू करें। पहला गाढ़ा पीला दूध (खीस/कोलोस्ट्रम) बच्चे का पहला प्राकृतिक टीका है। पहले 6 महीने तक सिर्फ और सिर्फ मां का दूध दें (पानी या घुट्टी भी न दें)। 6 महीने पूरे होने पर स्तनपान के साथ मसली हुई खिचड़ी, दलिया व हरी सब्जियां शुरू करें।",
        "keywords": ["breastfeeding", "feeding", "infant", "colostrum", "complementary", "स्तनपान", "मां का दूध", "ऊपरी आहार"],
        "source": "MAA Programme, MoHFW",
        "verified_by": "National Health Mission",
        "status": "Approved"
    },

    # 4. Hygiene & Sanitation
    {
        "id": "kb_hyg_001",
        "category": "hygiene",
        "subcategory": "handwashing",
        "title": "Critical Handwashing Steps and Infection Prevention",
        "title_hi": "हाथ धोने के 5 महत्वपूर्ण समय एवं स्वच्छता",
        "content_en": "Wash hands with soap and water for at least 20 seconds at 5 critical times: 1) Before preparing food; 2) Before eating or feeding a baby; 3) After using the toilet; 4) After cleaning a baby's bottom; 5) After handling garbage or animals. Proper handwashing prevents up to 50% of child diarrhea and respiratory illnesses.",
        "content_hi": "साबुन और पानी से कम से कम 20 सेकंड तक हाथ धोने के 5 प्रमुख समय: 1) खाना बनाने से पहले; 2) खाना खाने या बच्चे को खिलाने से पहले; 3) शौच के बाद; 4) बच्चे की शौच साफ करने के बाद; 5) कचरा छूने के बाद। साबुन से हाथ धोने से बच्चों में दस्त और निमोनिया से बचाव होता है।",
        "keywords": ["hygiene", "handwashing", "soap", "sanitation", "infection", "हाथ धोना", "स्वच्छता", "साबुन", "सफाई"],
        "source": "Swachh Bharat Mission (Grameen)",
        "verified_by": "Ministry of Jal Shakti & MoHFW",
        "status": "Approved"
    },

    # 5. Government Schemes
    {
        "id": "kb_sch_001",
        "category": "government_schemes",
        "subcategory": "jsy",
        "title": "Janani Suraksha Yojana (JSY) Institutional Delivery Benefits",
        "title_hi": "जननी सुरक्षा योजना (JSY) के लाभ",
        "content_en": "Janani Suraksha Yojana (JSY) promotes institutional delivery in government hospitals and accredited private health centres. In rural areas, mothers receive ₹1,400 directly into their bank account; in urban areas, ₹1,000. ASHA receives ₹600 for escorting and supporting rural institutional delivery. The scheme ensures free delivery, free medicines, and free food during hospital stay under JSSK.",
        "content_hi": "जननी सुरक्षा योजना (JSY) के तहत सरकारी अस्पताल या मान्यता प्राप्त केंद्र में प्रसव करवाने पर ग्रामीण क्षेत्र की महिला को ₹1,400 और शहरी क्षेत्र में ₹1,000 की नकद सहायता सीधे बैंक खाते में मिलती है। अस्पताल ले जाने वाली आशा दीदी को ₹600 प्रोत्साहन राशि मिलती है। इसके अलावा जेएसएसके (JSSK) के तहत प्रसव, दवाएं, भोजन और एम्बुलेंस पूरी तरह मुफ्त है।",
        "keywords": ["jsy", "janani", "suraksha", "delivery", "hospital", "financial", "1400", "जननी", "सुरक्षा", "प्रसव", "अस्पताल", "पैसे"],
        "source": "National Health Mission, MoHFW",
        "verified_by": "Ministry of Health & Family Welfare",
        "status": "Approved"
    },
    {
        "id": "kb_sch_002",
        "category": "government_schemes",
        "subcategory": "pmmvy",
        "title": "Pradhan Mantri Matru Vandana Yojana (PMMVY) Maternity Benefit",
        "title_hi": "प्रधानमंत्री मातृ वंदना योजना (PMMVY) मातृत्व लाभ",
        "content_en": "Under PMMVY, eligible pregnant women and lactating mothers receive ₹5,000 in DBT instalments for the first living child (₹3,000 on ANC registration and ₹2,000 after child birth and first cycle of vaccination). For a second child who is a girl, ₹6,000 is given in a single instalment to promote nutrition and girl child survival.",
        "content_hi": "प्रधानमंत्री मातृ वंदना योजना (PMMVY) के तहत पहले बच्चे के लिए महिला को कुल ₹5,000 की सहायता 2 किश्तों में (एएनसी पंजीकरण पर ₹3,000 और बच्चे के जन्म व पहले टीकाकरण पर ₹2,000) मिलती है। यदि दूसरा बच्चा लड़की है, तो एकमुश्त ₹6,000 की राशि दी जाती है।",
        "keywords": ["pmmvy", "matru", "vandana", "maternity", "5000", "6000", "मातृ", "वंदना", "मातृत्व लाभ"],
        "source": "Ministry of Women & Child Development",
        "verified_by": "MoWCD Guidelines",
        "status": "Approved"
    },
    {
        "id": "kb_sch_003",
        "category": "government_schemes",
        "subcategory": "pmjay",
        "title": "Ayushman Bharat PM-JAY Health Insurance Scheme",
        "title_hi": "आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना (PM-JAY)",
        "content_en": "Ayushman Bharat PM-JAY provides health cover of up to ₹5 lakh per family per year for secondary and tertiary care hospitalization to over 12 crore poor and vulnerable families. It covers 3 days of pre-hospitalization and 15 days of post-hospitalization expenses, diagnostics, medicines, and treatment in empaneled public and private hospitals completely cashless.",
        "content_hi": "आयुष्मान भारत योजना के तहत पात्र परिवारों को प्रति वर्ष ₹5 लाख तक का मुफ्त इलाज सरकारी और सूचीबद्ध निजी अस्पतालों में मिलता है। भर्ती होने पर जांच, दवाइयां, ऑपरेशन और भोजन सब कैशलेस होता है। परिवार के किसी भी सदस्य को अलग से पैसे नहीं देने पड़ते।",
        "keywords": ["ayushman", "pmjay", "insurance", "5 lakh", "card", "hospital", "आयुष्मान", "कार्ड", "5 लाख", "बीमा"],
        "source": "National Health Authority (NHA)",
        "verified_by": "National Health Authority",
        "status": "Approved"
    },

    # 6. ASHA Services
    {
        "id": "kb_asha_001",
        "category": "asha_services",
        "subcategory": "community_support",
        "title": "Services Provided by Your Village ASHA Worker",
        "title_hi": "आपकी गांव की आशा दीदी द्वारा प्रदान की जाने वाली सेवाएं",
        "content_en": "Your local ASHA worker provides: Free pregnancy test kits (Nischay); free IFA tablets, Calcium, ORS, Zinc, Condoms, and Mala-D contraceptive pills; registration for ANC and government schemes (JSY, PMMVY); assistance with hospital delivery and 108/102 ambulance; home visits for newborn care (HBYC/HBNC); immunisation reminders and VHSND sessions.",
        "content_hi": "आपकी आशा दीदी निम्नलिखित सेवाएं बिल्कुल मुफ्त देती हैं: निश्चय किट से गर्भावस्था जांच; आयरन, कैल्शियम, ओआरएस, जिंक, गर्भनिरोधक गोलियां व कंडोम; सरकारी योजनाओं (JSY, PMMVY) में नाम दर्ज कराना; अस्पताल प्रसव हेतु 102/108 एम्बुलेंस बुलाना; नवजात शिशु की गृह भेंट देखभाल; और टीकाकरण सत्र की जानकारी।",
        "keywords": ["asha", "services", "free", "contraceptive", "nischay", "ambulance", "आशा", "दीदी", "सेवाएं", "मुफ्त", "निश्चय"],
        "source": "ASHA Resource Centre, NHM",
        "verified_by": "National Health Mission",
        "status": "Approved"
    }
]

class KnowledgeBaseRepository:
    def __init__(self):
        self._firestore = FirestoreRepository("knowledge_base")
        self._records: List[Dict[str, Any]] = VERIFIED_KNOWLEDGE_RECORDS.copy()
        self._initialized = False

    def _ensure_synced(self):
        if not self._firestore.is_connected:
            return
        if not self._initialized:
            try:
                self._firestore.seed_if_empty(self._records, id_key="id")
                remote_docs = self._firestore.list_all()
                if remote_docs:
                    self._records = remote_docs
                self._initialized = True
            except Exception as e:
                logger.warning(f"KnowledgeBaseRepository sync warning: {e}")

    def list_approved(
        self,
        category: Optional[str] = None,
        query: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        self._ensure_synced()
        results = [r for r in self._records if r.get("status") == "Approved"]

        if category:
            cat_clean = category.strip().lower()
            results = [r for r in results if r.get("category", "").lower() == cat_clean]

        if query:
            q_clean = query.strip().lower()
            tokens = [t.strip("?,.!;:\"'()[]{}") for t in q_clean.split() if len(t.strip("?,.!;:\"'()[]{}")) >= 2]
            
            def score_record(rec: Dict[str, Any]) -> int:
                score = 0
                title = (rec.get("title", "") + " " + rec.get("title_hi", "")).lower()
                content = (rec.get("content_en", "") + " " + rec.get("content_hi", "")).lower()
                keywords = [k.lower() for k in rec.get("keywords", [])]

                # Full phrase match boost
                if q_clean in title or any(q_clean in kw for kw in keywords):
                    score += 20
                if q_clean in content:
                    score += 10

                for token in tokens:
                    if any(token in kw or kw in token for kw in keywords):
                        score += 5
                    if token in title:
                        score += 3
                    if token in content:
                        score += 1
                return score

            scored = [(score_record(r), r) for r in results]
            scored = [pair for pair in scored if pair[0] > 0]
            scored.sort(key=lambda x: x[0], reverse=True)
            results = [r for _, r in scored]

        return results[:limit]

    def get_by_id(self, record_id: str) -> Optional[Dict[str, Any]]:
        self._ensure_synced()
        for r in self._records:
            if r.get("id") == record_id:
                return r
        return None

knowledge_base_repo = KnowledgeBaseRepository()

