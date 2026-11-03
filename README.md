# SAHAYIKA (सहायिका)
### Voice-First Digital Companion for Frontline ASHA Workers in India

> **Core Philosophy:** *"Spend less time managing records. Spend more time supporting people."*

SAHAYIKA is an operational productivity and voice-first companion application specifically designed to reduce the administrative and cognitive burden of **ASHA (Accredited Social Health Activist)** community health workers in India.

---

## 🚀 Live Local Servers

Both backend and frontend are currently running and ready to test:

| Service | Local URL | Description |
| :--- | :--- | :--- |
| **Mobile Frontend (Web)** | [http://localhost:3000](http://localhost:3000) | Full mobile app rendered in an interactive smartphone frame |
| **Backend REST API** | [http://127.0.0.1:8008](http://127.0.0.1:8008) | FastAPI backend service with background workers |
| **Interactive API Docs** | [http://127.0.0.1:8008/api/v1/docs](http://127.0.0.1:8008/api/v1/docs) | Swagger OpenAPI UI for testing all REST endpoints |

---

## 📱 Quick Demo Access

1. Open [http://localhost:3000](http://localhost:3000) in your web browser.
2. On the Welcome screen, tap **"शुरू करें (Choose Language)"**.
3. Choose **हिन्दी (Hindi)** or **English**.
4. On the Login screen:
   - Tap **"⚡ डेमो लॉगिन (तत्काल प्रवेश)"** for instant one-click login, **OR**
   - Enter mobile number `9876543210` and use demo OTP `123456`.
5. Tap **"अनुमति दें और सहायिका शुरू करें"** on the Permissions screen.
6. Explore all 5 bottom navigation tabs and modules!

### Seeded ASHA Worker Profile
- **Name:** Sunita Devi (सुनीता देवी)
- **Role:** ASHA Worker
- **ASHA ID:** `ASHA-UP-VNS-2024-042`
- **Assigned Area:** Rampur Kalan (रामपुर कलां)
- **Sub-Centre:** Rampur SC-04
- **Primary Health Centre (PHC):** Kashi PHC, Varanasi, Uttar Pradesh
- **Assigned Clusters:** Rampur Kalan, Lakshmi Nagar, Shanti Kunj, Kalyanpur, Basti Vikas (34 Households)

---

## 🌟 Key Modules & Features

### 1. 🏠 Home Dashboard
- Dynamic time-of-day greeting in Hindi/English
- Four live summary indicators: Total Assigned Households (34), Completed Today (1), Pending Follow-ups (5), Urgent Requests (1)
- Daily Visit Target progress tracker
- Quick action shortcuts: Record Visit, Add Household, New Follow-up, Community Requests, Ask Assistant, Claims
- Today's Prioritised Task List with one-tap completion

### 2. 👥 Community & Household Management
- Complete directory of 34 households across 5 village clusters
- Search by family head, child name, or household ID
- Filter by village and clinical priority (Urgent, Priority, Routine)
- Structured Household Profile with family members, high-risk pregnancy markers (mild/severe anaemia, hypertension), infant vaccination schedules, visit history, and pending tasks
- Registration form for enrolling new households and members

### 3. 🎙️ Voice-First Field Visit Documentation
- Natural spoken visit documentation: ASHA worker speaks her observations (e.g. *"आज मीना देवी के घर गई थी। बच्चे का टीकाकरण अगले हफ्ते है। बीपी 118/76 सामान्य था। शुक्रवार को दोबारा जाना है।"*)
- Gnani Prisma STT transcribes speech into accurate Devanagari Hindi text
- Gnani Evon NLU extracts structured fields (Household, Beneficiary, Activity Category, Observations, Outcome, Follow-up date)
- **Editable Confirmation Screen:** The worker verifies and edits all extracted fields before committing
- **Automatic Task Generation:** Confirming a visit with follow-up required automatically schedules a follow-up task

### 4. 📅 Follow-up & Task Management
- Filter by: All, Due Today, Upcoming, Overdue, and Completed
- Categorised by: Maternal health, Child health, Vaccination reminder, Health camp (VHSND), etc.
- One-tap "Mark Done" with completion notes
- Reschedule modal to postpone tasks with reason tracking

### 5. 📩 Community Requests Management
- Handles community callbacks, nutrition inquiries (POSHAN Abhiyaan / THR), vaccination info, appointment assistance, and urgent health concerns
- Status pipeline: New ➔ Acknowledged ➔ In progress ➔ Resolved / Escalated
- Quick actions: Call beneficiary, Acknowledge, Mark Resolved, Escalate to ANM

### 6. 🤖 Gnani AI Voice Assistant
- Interactive voice & text health companion
- Answers questions regarding today's visit schedule, immunization camps, beneficiary follow-up history, and government schemes (POSHAN, JSY, PMVVY)
- **Strict Guardrails:** Never diagnoses illnesses, prescribes medicines, or gives unverified medical advice; directs emergency concerns to 108/112 and MO/ANM

### 7. 💰 Work Records & Incentive Assistant
- Activity recording and monthly claim preparation assistant (NHM illustrative norms)
- Classifies eligible activities (MCH, HBNC visits, full immunization, VHSNC meetings)
- Prepares draft monthly claim and simulates supervisor submission and payment disbursement

### 8. 🚨 Emergency SOS & 112 Support
- Differentiates immediate emergency vs urgent concern vs routine assistance
- Simulated India 112 / 108 emergency ambulance dispatch
- Multi-tier escalation: Level 1 (ASHA) ➔ Level 2 (ANM/PHC) ➔ Level 3 (108 Ambulance)

### 9. 🔔 Notification Centre
- Categorised in-app notifications (Urgent requests, follow-ups due, VHSND camp schedule, incentive disbursement)
- Mark individual or all notifications as read

### 10. 👤 Profile & Offline Sync
- Worker credentials, sub-centre, and PHC details
- Localisation switcher (Instant switch between Hindi & English)
- Audio feedback toggle
- Offline sync engine: records created without internet are queued locally and synchronized when online

---

## 🏗️ Technical Architecture

```
ASHA GNANI/
├── frontend/                     # React Native Expo Mobile App (JavaScript)
│   ├── App.js                   # Root container with web-responsive phone frame
│   ├── app.json                 # Expo configuration
│   ├── package.json             # Compatible dependencies (Expo 51, RN 0.74)
│   └── src/
│       ├── theme/               # Design tokens (Colors, Typography, Spacing, Radius)
│       ├── localisation/        # i18next dictionaries (Hindi & English)
│       ├── store/               # Zustand state stores (auth, language, app)
│       ├── components/          # Reusable accessible UI components
│       │   ├── common/          # AppButton, AppCard, AppHeader, AppInput, StatusBadge
│       │   ├── voice/           # VoiceButton, Waveform, RecordingIndicator, VoicePlayer
│       │   ├── household/       # HouseholdCard, BeneficiaryCard
│       │   └── tasks/           # TaskCard, PriorityBadge
│       ├── screens/             # 15+ comprehensive mobile screens
│       └── services/            # API client, Gnani AI, Firebase, Offline sync
├── backend/                     # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py              # FastAPI app with CORS & lifespan workers
│   │   ├── config.py            # Environment configuration
│   │   ├── api/v1/              # REST API endpoints (auth, households, visits, tasks, etc.)
│   │   ├── core/                # Security, dependencies, exceptions, logging
│   │   ├── models/ & schemas/   # Pydantic data validation schemas
│   │   ├── services/            # Business logic layer
│   │   ├── repositories/        # In-memory working database with 34 seeded records
│   │   ├── integrations/        # Gnani AI (Prisma, Evon, Timbre) & Firebase adapters
│   │   └── workers/             # Background reminder & sync reconciliation workers
│   └── requirements.txt
├── firebase/                    # Firebase security & configuration
│   ├── firestore.rules          # Strict role-based Firestore security rules
│   ├── firestore.indexes.json   # Compound indexes for fast querying
│   └── firebase.json
└── README.md
```

---

## 🔒 Security & Privacy

- **No Exposed Keys:** Real API keys are never stored inside the frontend application.
- **Least-Privilege Firestore Rules:** Access restricted strictly to authenticated ASHA workers for their assigned cluster.
- **Human-in-the-Loop:** AI-extracted visit data is never committed as an official record without explicit human confirmation.
- **Consent-First:** Personal health records and emergency location sharing require explicit consent.

---

## ⚙️ How to Restart Servers Manually

### Start Backend:
```bash
.venv/bin/python3 -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8008
```

### Start Frontend:
```bash
cd frontend
export PATH="/tmp/node-v20/bin:$PATH"
npx expo start --web --port 3000
```

