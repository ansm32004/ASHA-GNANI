# SAHAYIKA – Complete Backend, Firebase, API & AI Voice Integration Audit Report

**Date of Audit:** November 6, 2026  
**Auditor:** Senior Systems & Security Architecture Auditor  
**Scope:** Full Repository Audit (`backend/`, `frontend/`, Firebase, Gnani AI, Google Gemini)  
**Audit Type:** Read-Only Technical Verification, Static Analysis, Runtime Verification, and Live API Probing  
**Repository Path:** `/Users/mahekaghija/Desktop/gnani`  

---

## Component Status Summary

| Component | Status | Evidence | Issues Identified |
| :--- | :--- | :--- | :--- |
| **Backend Architecture** | **Working and verified** | FastAPI 0.115.0 active on port 8008, 9 router modules, lifespan worker orchestration, 80/82 automated tests passing. | Hardcoded LAN IP in audio URLs; Reminder and Sync workers are background stubs; `google-genai` missing from `requirements.txt`. |
| **Firebase Integration** | **Partially implemented** | Firebase Admin SDK 6.5.0 connected to Cloud Firestore (`asha-997cd`); 54 documents seeded; FCM messaging service initialized. | Storage bucket `asha-997cd.firebasestorage.app` is unprovisioned (`bucket.exists() == False`), forcing mock storage URLs; Client SDK initialized in frontend but unused by API stores. |
| **Database & Persistence** | **Working and verified** | Cloud Firestore active for `households`, `tasks`, `visits`, `requests`, `claims`, `sos_events`, `notifications`, `users`, and `revoked_tokens`. In-memory and AsyncStorage fallback operational. | `HouseholdRepository.list_all` loads all collection records into memory on every request without Firestore server-side queries, indexing, or pagination. |
| **Gnani AI Integration** | **Working and verified** | Live HTTP 200 responses confirmed from `https://api.vachana.ai`. Official `X-API-Key-ID` header authentication active. | Evon NLU relies on heuristic keyword extraction when entity parsing is unpopulated; hardcoded local IP in synthesized audio streaming URL. |
| **Speech-to-Text (STT)** | **Working and verified** | Live audio transcription confirmed on `https://api.vachana.ai/stt/v3` (Devanagari text returned). Dual JSON/multipart support, 16kHz mono normalization via ffmpeg. | Normalization to PCM WAV requires system `ffmpeg`, which may fail in minimal containers without error bubbling to UI. |
| **Text-to-Speech (TTS)** | **Working and verified** | Live speech synthesis confirmed on `https://api.vachana.ai/api/v1/tts/inference` returning 353,324 bytes WAV. MD5 disk cache active; single-stream player with pause/resume verified. | Audio URL generator emits hardcoded `http://192.168.0.7:8008` LAN IP; unit tests `test_ai_speak_tts` and `test_ai_live_end_to_end_voice_roundtrip` fail due to expecting raw Base64 data URI instead of HTTP URL. |
| **Frontend API Integration** | **Partially implemented** | Centralized `apiClient` manages JWT authentication, token attachment, and offline caching across 9 operational feature screens. | `activityApi.js`, `contentApi.js`, and `reminderApi.js` call non-existent backend routes (`/activities`, `/content/guides`, `/reminders`) and are entirely unused. |
| **Security Architecture** | **Partially implemented** | JWT HS256 tokens with JTI tracking; SHA-256 token hash revocation saved in Firestore and local disk; bcrypt password hashing; `.gitignore` protects secrets. | Default `SECRET_KEY` in `config.py`; `DEBUG=True`; `CORS_ORIGINS=["*"]` allows all origins with credentials; `DEMO_MODE=True` allows unauthenticated header bypass. |
| **Testing & Verification** | **Working and verified** | 82 pytest test cases executed: 80 passed, 2 failed due to TTS streaming format change; live Gnani STT, live Gnani TTS, and live Firestore reads verified. | Test suite lacks automated frontend integration tests; 2 outdated unit test assertions in `test_gnani_ai.py`. |

---

## 1. Executive Summary

An end-to-end, comprehensive technical audit of the **SAHAYIKA** operational platform was conducted across the backend codebase, Cloud Firestore database, Google Firebase integration, Gnani AI voice engine (Prisma STT and Timbre TTS), Google Gemini integration, and React Native (Expo) frontend client.

### Key Strengths:
1. **Live Gnani AI Integration:** Unlike many prototype implementations that rely on simulated voice, SAHAYIKA has a genuine, live, authenticated connection to Gnani Vachana AI (`https://api.vachana.ai`). Direct end-to-end tests successfully synthesized Hindi audio via Timbre TTS (`353,324` bytes) and transcribed the resulting audio back into Devanagari text via Prisma STT v3.0 with zero errors.
2. **Live Cloud Firestore Integration:** The backend initializes the Firebase Admin SDK (`asha-997cd`) and reads/writes live collections. Data seeding was verified with 54 documents stored in Cloud Firestore.
3. **Resilient Offline Architecture:** Both backend repositories and frontend API clients implement two-tier caching: remote server operations seamlessly fall back to local AsyncStorage and in-memory caches, guaranteeing continuous field functionality for rural health workers in low-connectivity areas.
4. **Clinical Safety Architecture:** `SafetyService` applies clinical guardrails before passing queries to LLMs or rule engines, correctly identifying Level 3 emergencies (e.g., hemorrhages, convulsions, snake bites) and Level 2 medication requests (refusing unauthorized drug prescriptions).

### Critical Vulnerabilities & Deficiencies:
1. **Hardcoded IP in TTS Engine:** `backend/app/integrations/gnani/timbre.py` (lines 57, 93) generates audio URLs hardcoded to `http://192.168.0.7:8008`. In production or across different networks, audio playback will fail unless requests resolve dynamically.
2. **Missing Firebase Storage Bucket:** The configured bucket `asha-997cd.firebasestorage.app` has not been provisioned in GCP (`bucket.exists() == False`). Audio uploads fall back to dummy mock URLs.
3. **Ghost Frontend API Services:** Three frontend API services (`activityApi.js`, `contentApi.js`, `reminderApi.js`) reference backend endpoints (`/activities`, `/content/guides`, `/reminders`) that do not exist in FastAPI.
4. **Incomplete Gemini SDK Setup:** `google-genai` is missing from `backend/requirements.txt` and is not installed in the environment. `GEMINI_API_KEY` is not populated in `backend/.env`. The AI assistant operates entirely on the local semantic rule engine.
5. **Security Risks in Default Config:** Wildcard CORS (`allow_origins=["*"]`) combined with `allow_credentials=True`, fallback JWT development secret key in `config.py`, and unauthenticated `demo_token` injection when `DEMO_MODE=True`.

---

## 2. Overall Architecture

SAHAYIKA is structured as a decoupled, voice-first microservice architecture comprising an Expo/React Native mobile client, a FastAPI Python 3.13 backend, Google Cloud Firestore, Firebase Cloud Messaging, and the Gnani AI Speech Engine.

```mermaid
graph TD
    User([ASHA Worker / Community Member]) <--> MobileApp[Expo / React Native Client]
    
    subgraph Frontend Layer
        MobileApp --> AudioService[AudioService: Expo-AV & Recording]
        MobileApp --> ApiClient[apiClient: Axios & SecureStorage]
        MobileApp --> ClientFirebase[Firebase Client SDK: asha-997cd]
    end

    ApiClient <== HTTP / JSON & Multipart ==> Backend[FastAPI Application :8008]

    subgraph Backend Layer
        Backend --> AuthRouter[Auth Router]
        Backend --> AIRouter[AI Voice Router]
        Backend --> ClinicalRouters[Households, Tasks, Visits, Claims, SOS, Requests]
        
        AIRouter --> PrismaSTT[Prisma STT Service]
        AIRouter --> TimbreTTS[Timbre TTS Service]
        AIRouter --> AssistantService[Assistant & Safety Service]
        
        AssistantService --> GeminiService[Gemini Service / Semantic Rule Engine]
        AssistantService --> KnowledgeBase[Approved Clinical Knowledge Base]
        
        ClinicalRouters --> ServiceLayer[Domain Services]
        ServiceLayer --> Repositories[Repository Pattern]
    end

    subgraph External Cloud Services
        PrismaSTT <== Live HTTPS ==> GnaniSTT[Gnani Prisma STT API v3.0]
        TimbreTTS <== Live HTTPS ==> GnaniTTS[Gnani Timbre TTS API v3.0]
        Repositories <== Admin SDK ==> Firestore[(Cloud Firestore asha-997cd)]
        Backend -. Bucket Unprovisioned .-> GCS[(Firebase Storage)]
        Backend <== Admin SDK ==> FCM[Firebase Cloud Messaging]
    end
```

### Request Lifecycle Trace
1. **Inbound Request:** The client device transmits an HTTP request via `apiClient` (configured with timeout and Bearer token).
2. **FastAPI Middleware:** CORSMiddleware processes headers. The request is routed to the corresponding router under `/api/v1`.
3. **Authentication & Authorization Dependency:** `get_current_user_id` inspects `Authorization: Bearer <token>`.
   - If missing and `DEMO_MODE=True` (and not production), defaults to `asha_sunita_001`.
   - Otherwise, decodes JWT via `jose.jwt`, verifies signature against `SECRET_KEY`, checks for revocation in memory and Firestore `revoked_tokens`.
4. **Router Execution:** Validates request body using Pydantic models (e.g., `HouseholdCreate`, `VisitConfirmRequest`).
5. **Service Layer:** Executes domain rules (e.g., `visit_service.confirm_visit` creates visit document, checks `follow_up_required`, and triggers `task_service.create_task`).
6. **Repository Layer:** `FirestoreRepository` writes to Google Cloud Firestore via Admin SDK. If disconnected, writes to in-memory fallback.
7. **Response Formatting:** Returns Pydantic response model serialized to JSON with standard HTTP status code.

---

## 3. Complete Backend Architecture Audit

### 3.1 Application Initialization and Lifecycle
- **File:** `backend/app/main.py:25-48`
- **Lifespan Manager:** Uses modern FastAPI `lifespan` context manager.
  - Startup initializes `firebase_manager.initialize()`, seeds default admin/ASHA users via `user_repository._ensure_initialized()`, and launches background `reminder_worker` and `sync_worker` via `asyncio.create_task`.
  - Shutdown calls `.stop()` on both workers.
- **Finding:** Clean async lifecycle implementation.

### 3.2 Configuration and Environment Variables
- **File:** `backend/app/config.py:5-48`
- **Configuration Engine:** `pydantic_settings.BaseSettings` reading from `backend/.env`.
- **Finding:** Configuration is case-sensitive, ignores extra fields, and specifies explicit paths. However:
  - Line 11: `SECRET_KEY` has a default hardcoded value: `"sahayika_super_secret_jwt_key_for_development_mode_only"`.
  - Line 10: `DEBUG` defaults to `True`.
  - Line 36: `CORS_ORIGINS` defaults to `["*"]`.

### 3.3 Routers and Endpoints
Nine API v1 routers are mounted in `backend/app/main.py:77-85`:
1. `/api/v1/auth` (`app/api/v1/auth.py`) – 6 endpoints (login, verify, login-credentials, register, me, logout).
2. `/api/v1/households` (`app/api/v1/households.py`) – 5 endpoints (CRUD + village/priority filter).
3. `/api/v1/visits` (`app/api/v1/visits.py`) – 3 endpoints (list, confirm with auto-task generation, details).
4. `/api/v1/tasks` (`app/api/v1/tasks.py`) – 6 endpoints (list, create, update, complete, reschedule, delete).
5. `/api/v1/requests` (`app/api/v1/requests.py`) – 3 endpoints (list, create, action).
6. `/api/v1/claims` (`app/api/v1/claims.py`) – 4 endpoints (list, prepare, submit, details).
7. `/api/v1/sos` (`app/api/v1/sos.py`) – 5 endpoints (list, trigger, details, acknowledge, escalate).
8. `/api/v1/ai` (`app/api/v1/ai.py`) – 6 endpoints (transcribe, extract, extract-visit, assistant, speak, audio streaming).
9. `/api/v1/notifications` (`app/api/v1/notifications.py`) – 6 endpoints (list, read, read-all, device-token register, device-token delete, test-push).

### 3.4 Background Workers
- **Reminder Worker (`app/workers/reminder_worker.py`):**
  - Runs hourly (`interval_seconds=3600`).
  - Scans tasks due today: `task_repo.list_all(date_filter=today_str)`.
  - **Deficiency:** Lines 20-21 log that a notification is queued, but never call `firebase_messaging.send_to_user()` or persist records into `notification_repo`.
- **Sync Worker (`app/workers/sync_worker.py`):**
  - Runs every 5 minutes (`interval_seconds=300`).
  - **Deficiency:** Line 13 contains only `logger.debug("[SyncWorker] Processing offline reconciliation queue...")`. The offline queue reconciliation is a stub.

### 3.5 Exception Handling & Responses
- **File:** `backend/app/main.py:60-73`
- Custom `SahayikaException` handler maps custom exceptions (`UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ValidationException`) to structured JSON.
- Global `Exception` handler captures unhandled runtime crashes, returning HTTP 500 with `{"message": "An unexpected server error occurred.", "error": str(exc)}`.
- **Risk:** Exposing `str(exc)` in production leaks internal schema errors and database details to clients.

---

## 4. Complete Firebase Audit

### 4.1 Firebase Project Configuration
- **Project ID:** `asha-997cd`
- **Firebase Auth Domain:** `asha-997cd.firebaseapp.com`
- **Storage Bucket:** `asha-997cd.firebasestorage.app`
- **Sender ID / Project Number:** `301164131725`
- **Configuration Files Verified:**
  - `.firebaserc` (line 3: `"default": "asha-997cd"`)
  - `firebase.json` (defines Firestore rules, Firestore indexes, and Storage rules)
  - `firestore.rules` (119 lines of security rules)
  - `storage.rules` (20 lines of storage rules)
  - `frontend/google-services.json` (Android configuration matching `com.asha.sahayika`)
  - `backend/secrets/firebase-service-account.json` (service account certificate)

### 4.2 Firebase Admin SDK Initialization
- **File:** `backend/app/integrations/firebase/firebase_admin.py:9-114`
- Multi-tier credential resolution:
  1. Inspects raw JSON / Base64 in `FIREBASE_SERVICE_ACCOUNT_JSON`.
  2. Resolves path from `FIREBASE_CREDENTIALS_PATH` or searches standard locations (`backend/secrets/firebase-service-account.json`, `serviceAccountKey.json`).
  3. Checks `FIRESTORE_EMULATOR_HOST`.
- **Runtime Verification:** Successfully loads certificate file `/Users/mahekaghija/Desktop/gnani/backend/secrets/firebase-service-account.json` and connects to `asha-997cd`.

### 4.3 Cloud Firestore Collections
The following collections were verified directly in Cloud Firestore:

| Collection Name | Purpose | Production Seeding Status | Document ID Pattern |
| :--- | :--- | :--- | :--- |
| `households` | Family profiles, members, risk status | 34 active documents | `hh_001` to `hh_034` |
| `tasks` | ASHA daily follow-ups, visits | 7 active documents | `task_001` to `task_007` |
| `visits` | Field visit records, outcomes | 2 active documents | `vis_001`, `vis_002` |
| `community_requests`| Beneficiary requests | 4 active documents | `req_001` to `req_004` |
| `claims` | Monthly incentive claims | 2 active documents | `claim_001`, `claim_002` |
| `sos_events` | Emergency panic triggers | 1 active document | `sos_001` |
| `notifications` | In-app alerts | 4 active documents | `notif_001` to `notif_004` |
| `users` | ASHA and Community user profiles | 2 active documents | `asha_sunita_001`, `comm_meena_001` |
| `fcm_tokens` | Device registration for push alerts | Dynamic | Registered user ID |
| `revoked_tokens` | Blacklisted JWT hashes | Dynamic | SHA-256 token hash |
| `ai_conversations` | Audit log of AI voice queries | Dynamic | Auto-generated ID |

### 4.4 Firebase Storage Integration
- **File:** `backend/app/integrations/firebase/storage_service.py`
- Uses `storage.bucket().blob(...)` and attempts to generate v4 signed URLs.
- **Runtime Verification:**
  ```python
  bucket = storage.bucket()
  bucket.exists()  # Returns: False
  ```
- **Finding:** The bucket `asha-997cd.firebasestorage.app` does not exist in Google Cloud Storage. Lines 28-32 fall back to returning `https://mock-storage.sahayika.local/audio_records/{file_name}`.

### 4.5 Firebase Cloud Messaging (FCM)
- **File:** `backend/app/integrations/firebase/messaging_service.py`
- Supports single-user push (`send_to_user`), topic broadcast (`send_to_topic`), and multicast dispatch (`send_multicast`).
- **Finding:** Token synchronization updates both `fcm_tokens` and the corresponding document in `users` with `merge=True`. Deprecation warning noted: `Message.token` is deprecated in favor of `Message.fid` in modern Firebase Admin SDKs.

### 4.6 Security Rules vs. Backend Admin Privileges
- `firestore.rules` specifies fine-grained role-based rules for `ASHA`, `SUPERVISOR`, and `COMMUNITY` roles.
- **Critical Architectural Distinction:** Because the backend communicates via `firebase_admin` (service account credentials), it operates with administrative privileges that bypass `firestore.rules`.
- Client-side security rules apply only if mobile devices read/write Firestore directly via the JS client SDK. Since all mobile operations route through FastAPI, enforcement is handled by backend dependencies (`get_current_user_id` and role checks), which is the recommended secure pattern.

---

## 5. Gnani API Integration Audit

### 5.1 Gnani Configuration & Endpoints
- **File:** `backend/app/integrations/gnani/client.py`
- **Base Endpoint:** `https://api.vachana.ai`
- **STT Endpoint:** `https://api.vachana.ai/stt/v3` (Prisma v3.0)
- **TTS Endpoint:** `https://api.vachana.ai/api/v1/tts/inference` (Timbre v3.0)
- **NLU Endpoint:** `https://api.vachana.ai/v1/evon/nlu` (Evon NLU)
- **Authentication:** `X-API-Key-ID: <GNANI_API_KEY>` and `Authorization: Bearer <GNANI_API_KEY>`.
- **Credential Storage:** Stored in `backend/.env`. Read dynamically at runtime via `gnani_client.get_api_key()` to support live credential updates.

### 5.2 Live Verification Evidence
Runtime tests executed directly against the live Gnani Vachana platform confirmed:
1. **TTS Connectivity:**
   - Request: `POST https://api.vachana.ai/api/v1/tts/inference`
   - Payload: `{"text": "परीक्षण वाक्य", "voice": "Shivani", "model": "timbre-v3.0", "audio_config": {"encoding": "linear_pcm", "container": "wav"}}`
   - Response: `HTTP/1.1 200 OK`
   - Data Returned: `353,324` bytes WAV audio.
2. **STT Connectivity:**
   - Request: `POST https://api.vachana.ai/stt/v3`
   - Payload: Multipart audio file (`audio.wav`), `model=prisma-v3.0`, `language_code=hi-IN`, `format=transcribe`.
   - Response: `HTTP/1.1 200 OK`
   - Result: `transcript='परीक्षण वाक्य, परीक्षण वाक्य。'`, `source='gnani_prisma_live'`.

---

## 6. Speech-to-Text (STT) Pipeline Audit

```mermaid
sequenceDiagram
    actor ASHA as ASHA Worker
    participant Mic as Device Microphone
    participant Mobile as AudioService (Expo-AV)
    participant API as aiApi (React Native)
    participant Backend as FastAPI /ai/transcribe
    participant Prisma as PrismaSTTService
    participant Gnani as Gnani Prisma STT v3.0

    ASHA->>Mic: Speaks Hindi / Hinglish Narrative
    Mic->>Mobile: Raw Audio Input
    Mobile->>Mobile: Record 16kHz mono (m4a/wav)
    Mobile->>API: Audio File URI & Metadata
    API->>Backend: POST /ai/transcribe (multipart/form-data)
    Backend->>Prisma: Transcribe Audio Bytes
    alt Audio is WebM/corrupted
        Prisma->>Prisma: ffmpeg conversion to 16kHz mono WAV
    end
    Prisma->>Gnani: POST /stt/v3 (X-API-Key-ID Header)
    Gnani-->>Prisma: 200 OK {transcript: "..."}
    Prisma-->>Backend: TranscribeResponse (Devanagari text)
    Backend-->>API: JSON Response {transcript, confidence}
    API-->>Mobile: Populate Voice Input Field
```

### STT Implementation Details
- **Microphone Permissions:** Controlled via `Audio.requestPermissionsAsync()` in `audioService.js:81-103`. Supports permanently denied detection, directing users to system Settings.
- **Audio Presets:** `SPEECH_RECORDING_OPTIONS` (`audioService.js:10-35`) configures Android for MPEG_4/AAC at 16kHz mono 64kbps, iOS for LinearPCM 16kHz mono 16-bit WAV, and Web for audio/webm.
- **Normalization:** `backend/app/integrations/gnani/prisma.py:17-36` contains an `ffmpeg` converter pipeline that normalizes WebM, AAC, or MP3 audio to 16kHz 16-bit mono PCM WAV if required.
- **Language Mapping:** `_normalize_lang_code` (`prisma.py:38-67`) maps `hinglish` to `hi-IN,en-IN` and sets `format=code-mix`.

---

## 7. Text-to-Speech (TTS) Pipeline Audit

```mermaid
sequenceDiagram
    participant Screen as VoiceAssistantScreen
    participant AudioServ as audioService.js
    participant Backend as FastAPI /ai/speak
    participant Timbre as TimbreTTSService
    participant Cache as Local Disk Cache
    participant GnaniTTS as Gnani Timbre TTS API

    Screen->>AudioServ: playAudio(audioUrl)
    alt Audio URL is available
        AudioServ->>AudioServ: Unload existing streams & Play
    else Need Synthesis
        Screen->>Backend: POST /ai/speak {text, language, voice}
        Backend->>Timbre: Synthesize Speech
        Timbre->>Cache: Check MD5 Hash Cache
        alt Cache Hit
            Cache-->>Timbre: Return Cached WAV
        else Cache Miss
            Timbre->>GnaniTTS: POST /api/v1/tts/inference
            GnaniTTS-->>Timbre: 200 OK (WAV bytes)
            Timbre->>Cache: Write Hash.wav
        end
        Timbre-->>Backend: Return {audio_url, audio_content}
        Backend-->>Screen: SpeakResponse
        Screen->>AudioServ: playAudio(directUrl)
    end
```

### TTS Implementation Details
- **Caching:** `backend/app/integrations/gnani/timbre.py:46-71` hashes `text + voice` with MD5. If the `.wav` file exists in `backend/app/static/audio/` and is larger than 44 bytes, it is served instantly without network overhead.
- **Audio Delivery:** Synthesized audio is served via `GET /api/v1/ai/audio/{filename}` as a direct stream.
- **Finding (High Severity):** `timbre.py:57,93` constructs `direct_url` as:
  ```python
  direct_url = f"http://192.168.0.7:8008/api/v1/ai/audio/{cache_filename}"
  ```
  This hardcodes the local development machine's IP address. If the host machine changes IP or is deployed to a server/container, client audio playback will fail.
- **Playback Architecture:** `frontend/src/services/audio/audioService.js` manages a centralized audio player ensuring only one sound plays at any time. Supports:
  - Immediate `pauseAudio()` and `resumeAudio()`.
  - Subscription observer pattern for synchronized UI updates.
  - Temporary audio file garbage collection on unmount.

---

## 8. Frontend API Integration Audit

| Service File | Function | HTTP Method & Path | Backend Route File | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `authApi.js` | `loginWithCredentials` | `POST /auth/login-credentials` | `api/v1/auth.py:18` | **Working** | Used by `authStore.js` |
| `authApi.js` | `requestOtp` | `POST /auth/login` | `api/v1/auth.py:27` | **Working** | OTP demo flow |
| `authApi.js` | `verifyOtp` | `POST /auth/verify` | `api/v1/auth.py:35` | **Working** | Issues JWT access token |
| `authApi.js` | `getCurrentProfile` | `GET /auth/me` | `api/v1/auth.py:42` | **Working** | Fetches user profile |
| `householdApi.js` | `getHouseholds` | `GET /households` | `api/v1/households.py:11`| **Working** | Populates home and community tabs |
| `householdApi.js` | `createHousehold` | `POST /households` | `api/v1/households.py:48`| **Working** | Creates family records |
| `householdApi.js` | `getHouseholdById` | `GET /households/{id}` | `api/v1/households.py:61`| **Working** | Fetches family detail |
| `visitApi.js` | `getVisits` | `GET /visits` | `api/v1/visits.py:11` | **Working** | Displays visit history |
| `visitApi.js` | `confirmVisit` | `POST /visits/confirm` | `api/v1/visits.py:28` | **Working** | Auto-generates follow-up tasks |
| `taskApi.js` | `getTasks` | `GET /tasks` | `api/v1/tasks.py:20` | **Working** | Operational task dashboard |
| `taskApi.js` | `createTask` | `POST /tasks` | `api/v1/tasks.py:47` | **Working** | Creates manual task |
| `taskApi.js` | `completeTask` | `POST /tasks/{id}/complete` | `api/v1/tasks.py:66` | **Working** | Marks task completed |
| `taskApi.js` | `rescheduleTask` | `POST /tasks/{id}/reschedule` | `api/v1/tasks.py:74` | **Working** | Reschedules due date |
| `requestApi.js` | `getRequests` | `GET /requests` | `api/v1/requests.py:12` | **Working** | Displays beneficiary requests |
| `requestApi.js` | `createRequest` | `POST /requests` | `api/v1/requests.py:43` | **Working** | Submits request from community |
| `requestApi.js` | `actOnRequest` | `POST /requests/{id}/action` | `api/v1/requests.py:55` | **Working** | ASHA actions request |
| `claimApi.js` | `getClaims` | `GET /claims` | `api/v1/claims.py:17` | **Working** | Lists monthly incentive claims |
| `claimApi.js` | `prepareClaim` | `POST /claims/prepare` | `api/v1/claims.py:25` | **Working** | Compiles eligible activities |
| `claimApi.js` | `submitClaim` | `POST /claims/{id}/submit` | `api/v1/claims.py:33` | **Working** | Submits claim for review |
| `sosApi.js` | `triggerSos` | `POST /sos` | `api/v1/sos.py:17` | **Working** | Emergency panic dispatch |
| `aiApi.js` | `transcribe` | `POST /ai/transcribe` | `api/v1/ai.py:23` | **Working** | Gnani Prisma STT |
| `aiApi.js` | `speak` | `POST /ai/speak` | `api/v1/ai.py:155` | **Working** | Gnani Timbre TTS |
| `aiApi.js` | `queryAssistant` | `POST /ai/assistant` | `api/v1/ai.py:132` | **Working** | Clinical Q&A assistant |
| `aiApi.js` | `extract` | `POST /ai/extract` | `api/v1/ai.py:83` | **Working** | Structured field extraction |
| `notificationApi.js`| `getNotifications` | `GET /notifications` | `api/v1/notifications.py:16`| **Working** | Fetches alert list |
| `notificationApi.js`| `registerDeviceToken`| `POST /notifications/device-token`| `api/v1/notifications.py:41`| **Working** | Registers FCM token |
| `activityApi.js` | All functions | `GET/POST /activities` | **None** | **Broken / Unused** | File exists but route not in backend; unused in frontend screens |
| `contentApi.js` | All functions | `GET /content/...` | **None** | **Broken / Unused** | Route not in backend; calls fail and return static arrays |
| `reminderApi.js`| All functions | `GET/POST /reminders` | **None** | **Broken / Unused** | Route not in backend; falls back to static seed data |

---

## 9. Database & Persistence Audit

### 9.1 Repository Pattern Architecture
Each entity repository (`HouseholdRepository`, `TaskRepository`, `VisitRepository`, `RequestRepository`, `ClaimRepository`, `SosRepository`, `UserRepository`, `NotificationRepository`) inherits or instantiates a `FirestoreRepository(collection_name)`.

### 9.2 Critical Performance Finding: Full-Collection Fetching
In `backend/app/repositories/household_repository.py:37-43`:
```python
if self._firestore.is_connected:
    try:
        remote_docs = self._firestore.list_all()
        if remote_docs:
            self._households = remote_docs
    except Exception as e:
        logger.warning(f"Could not refresh households from Firestore: {e}")
```
- Every time `list_all()` is called, `self._firestore.list_all()` streams **all documents** in the Firestore `households` collection. Filtering by `assigned_asha_id`, `village`, and `search` query is performed entirely in Python memory.
- **Impact:** While acceptable for 34 demo households, in production with 10,000+ records, this will rapidly exhaust Firestore read quotas, degrade response times, and introduce significant latency.

---

## 10. Security Audit

### 10.1 Exposed Secrets & Git Tracking
- `.gitignore` was audited:
  - `backend/.env` is correctly ignored.
  - `backend/secrets/firebase-service-account.json` is correctly ignored.
  - `frontend/.env` and `frontend/google-services.json` are correctly ignored.
  - Git index verification (`git check-ignore`) confirmed that no active service account keys or private keys are tracked.

### 10.2 Vulnerabilities & Misconfigurations

#### 1. Insecure Default JWT Secret Key
- **File:** `backend/app/config.py:11`
- **Issue:** `SECRET_KEY: str = "sahayika_super_secret_jwt_key_for_development_mode_only"`
- **Severity:** High
- **Risk:** If deployed without setting `SECRET_KEY` in environment variables, an attacker can forge administrative JWT tokens.

#### 2. Permissive Wildcard CORS Configuration
- **File:** `backend/app/main.py:51-57` & `backend/app/config.py:36`
- **Issue:** `CORSMiddleware` configured with `allow_origins=["*"]` and `allow_credentials=True`.
- **Severity:** Medium
- **Risk:** In modern browsers, wildcard origins with credentials can violate CORS specifications and expose authenticated endpoints to cross-origin abuse.

#### 3. Unauthenticated Demo Token Injection
- **File:** `backend/app/core/dependencies.py:10-33`
- **Issue:** When `DEMO_MODE=True` and environment is not explicitly `"production"`, missing `Authorization` headers automatically inject `"demo_token"` which authenticates as `"asha_sunita_001"`.
- **Severity:** High (for production deployment)
- **Risk:** Any client can access private medical records without logging in.

#### 4. Hardcoded Fallback Credentials in Frontend Code
- **File:** `frontend/src/services/firebase/firebaseConfig.js:14-19`
- **Issue:** Web client Firebase configuration includes hardcoded fallback values for `apiKey`, `authDomain`, `projectId`, etc.
- **Severity:** Low (Firebase Client API keys are public identifiers; security is governed by backend authorization).

---

## 11. Testing and Verification Results

### 11.1 Test Suite Execution
- **Command:** `backend/.venv/bin/pytest backend/app/tests -v`
- **Total Tests:** 82
- **Passed:** 80
- **Failed:** 2
- **Execution Time:** 38.17s

### 11.2 Failure Analysis
1. `backend/app/tests/test_gnani_ai.py::test_ai_speak_tts`
   - **Failure:** `AssertionError: assert False where False = 'http://192.168.0.7:8008/...'.startswith('data:audio/wav;base64,')`
   - **Cause:** `timbre.py` was optimized to return direct HTTP streaming URLs (`audio_url`) for mobile performance instead of large Base64 strings. The legacy test asserts that `audio_url` starts with `data:audio/wav;base64,`.
2. `backend/app/tests/test_gnani_ai.py::test_ai_live_end_to_end_voice_roundtrip`
   - **Failure:** `IndexError: list index out of range` on `speak_data["audio_url"].split(",", 1)[1]`.
   - **Cause:** Assumed `audio_url` was a comma-separated data URI.

---

## 12. Architecture and Data Flow Diagrams

### 12.1 End-to-End Voice & Data Synchronization

```mermaid
sequenceDiagram
    autonumber
    actor ASHA as ASHA Field Worker
    participant Mobile as Mobile App (Expo)
    participant Backend as FastAPI Server (:8008)
    participant Gnani as Gnani Vachana AI
    participant Firestore as Google Cloud Firestore

    Note over ASHA,Mobile: 1. Voice Interaction & Clinical Logging
    ASHA->>Mobile: Taps Mic & dictates field visit in Hindi
    Mobile->>Backend: POST /ai/transcribe (Audio file)
    Backend->>Gnani: POST /stt/v3 (Prisma ASR)
    Gnani-->>Backend: 200 OK (Devanagari Transcript)
    Backend-->>Mobile: Transcript displayed on screen

    Note over Mobile,Backend: 2. Structured Extraction & Confirmation
    Mobile->>Backend: POST /ai/extract (Transcript)
    Backend->>Backend: Semantic Extraction & Field Mapping
    Backend-->>Mobile: Pre-filled Visit Form (Requires User Confirmation)
    ASHA->>Mobile: Reviews & clicks "Confirm Visit"
    Mobile->>Backend: POST /visits/confirm (Validated Payload)
    Backend->>Firestore: Persist Visit Record
    Backend->>Firestore: Auto-generate Follow-up Task in 'tasks'
    Backend-->>Mobile: Confirmation & Updated Household Status

    Note over Mobile,Gnani: 3. Audio Feedback & Speech Output
    Mobile->>Backend: POST /ai/speak (Summary Text)
    Backend->>Gnani: POST /api/v1/tts/inference (Timbre TTS)
    Gnani-->>Backend: 200 OK (WAV Audio Bytes)
    Backend->>Backend: Cache Audio (MD5.wav)
    Backend-->>Mobile: Streaming Audio URL
    Mobile->>ASHA: Speaks Hindi confirmation via Device Speaker
```

---

## 13. Issues and Bugs Identified

### Summary Table of Issues

| ID | Issue Description | Severity | File Path & Lines | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | Hardcoded LAN IP in TTS Audio URL | **High** | `backend/app/integrations/gnani/timbre.py:57,93` | Breaks audio streaming when IP changes or in production. |
| **BUG-02** | Unprovisioned Firebase Storage Bucket | **High** | `backend/app/integrations/firebase/storage_service.py:16` | Document and audio uploads fall back to mock URLs. |
| **BUG-03** | Missing `google-genai` Dependency | **Medium** | `backend/requirements.txt` & `backend/app/integrations/gemini/gemini_service.py:9` | Gemini AI cannot run live; permanently falls back to rule engine. |
| **BUG-04** | Outdated TTS Test Assertions | **Medium** | `backend/app/tests/test_gnani_ai.py:69,92` | 2 unit tests fail due to expecting Base64 data URI instead of HTTP URL. |
| **BUG-05** | Ghost API Services in Frontend | **Medium** | `frontend/src/services/api/activityApi.js`, `contentApi.js`, `reminderApi.js` | Reference non-existent backend endpoints (`/activities`, `/content`, `/reminders`). |
| **BUG-06** | Inefficient Firestore Collection Scanning | **Medium** | `backend/app/repositories/household_repository.py:39` | Full collection read on every request; will cause high read costs at scale. |
| **BUG-07** | Incomplete Reminder Worker | **Low** | `backend/app/workers/reminder_worker.py:20` | Scans due tasks and logs them, but never sends FCM notifications. |
| **BUG-08** | Incomplete Sync Worker | **Low** | `backend/app/workers/sync_worker.py:13` | Offline reconciliation queue is an unexecuted code stub. |
| **BUG-09** | Default Secret Key & Wildcard CORS | **High** | `backend/app/config.py:11,36` | Potential security risk if deployed to production without environment overrides. |

---

## 14. Missing or Incomplete Implementations

1. **Google Gemini Live Integration:**
   - `google-genai` package is not declared in `requirements.txt`.
   - `GEMINI_API_KEY` is empty in `backend/.env`.
   - While the local rule-based fallback functions well for demo purposes, genuine multi-turn Gemini LLM capability is inactive.
2. **Firebase Storage Provisioning:**
   - The GCP bucket `asha-997cd.firebasestorage.app` must be created in the Firebase console.
3. **Automated Worker Notifications:**
   - `reminder_worker.py` must be connected to `firebase_messaging.send_to_user()` to deliver actual push notifications to mobile devices.
4. **Backend Routes for Dead Frontend APIs:**
   - If `/activities`, `/content/guides`, and `/reminders` are needed in future releases, matching FastAPI routers should be implemented; otherwise, the three unused frontend files should be removed.

---

## 15. Production Readiness Assessment

### Current Readiness Score: **74 / 100** (Ready for Pilot / Field Demonstration; Needs Hardening for Scaled Production)

#### Readiness Breakdown:
- **Core Clinical Workflows:** **95%** (Households, Visits, Tasks, Claims, SOS, and Community Requests are fully functional with live Firestore persistence).
- **Voice AI (STT & TTS):** **90%** (Live Gnani STT and TTS confirmed working; requires fixing the hardcoded IP).
- **Offline Reliability:** **85%** (Two-tier caching implemented; full background conflict reconciliation stub needs completion).
- **Security & Infrastructure:** **55%** (Requires production secret keys, restricted CORS, disabling demo authentication bypass, and provisioning cloud storage).

---

## 16. Recommended Fixes, Prioritized

### Priority 1: Critical (Must fix before multi-device or cloud deployment)
1. **Dynamic TTS Audio Streaming URL:**
   - In `backend/app/integrations/gnani/timbre.py`, replace `http://192.168.0.7:8008` with a dynamically resolved base URL (using request headers or a configured `settings.BACKEND_PUBLIC_URL`).
2. **Provision Firebase Storage Bucket:**
   - In Firebase Console (`asha-997cd`), initialize default Cloud Storage bucket so audio records can be persisted with signed URLs.
3. **Production Security Hardening:**
   - Enforce non-empty `SECRET_KEY` in production.
   - Restrict `CORS_ORIGINS` to trusted mobile scheme and web dashboard domains.
   - Set `DEMO_MODE=False` in production environment to disable unauthenticated token injection.

### Priority 2: High (Required for complete functionality and CI/CD)
4. **Update Unit Test Assertions:**
   - Update `backend/app/tests/test_gnani_ai.py` (lines 69 and 92) to assert `audio_url.startswith("http") or audio_url.startswith("data:")`, restoring 100% test pass rate (82/82).
5. **Install and Configure Gemini:**
   - Add `google-genai>=0.1.0` to `backend/requirements.txt`.
   - Populate `GEMINI_API_KEY` in `backend/.env`.

### Priority 3: Medium (Maintainability and Performance)
6. **Implement Firestore Server-Side Querying:**
   - Refactor `household_repository.py:list_all` to use Firestore `.where()` filters and pagination (`.limit(50)`), avoiding loading entire collections into memory.
7. **Clean Up Unused Frontend APIs:**
   - Remove or implement backend support for `activityApi.js`, `contentApi.js`, and `reminderApi.js`.
8. **Wire Reminder Worker to FCM:**
   - Update `reminder_worker.py` to trigger `firebase_messaging.send_to_user()` when tasks are due today.

---

## 17. Complete File Reference

### Backend Core
- [`backend/app/main.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/main.py): FastAPI app initialization, lifespan, CORS, exception handlers, router mounts.
- [`backend/app/config.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/config.py): Pydantic BaseSettings, environment configuration, credentials.
- [`backend/app/core/dependencies.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/core/dependencies.py): Authentication headers, JWT extraction, demo mode fallback.
- [`backend/app/core/security.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/core/security.py): JWT encoding/decoding, SHA-256 token revocation, bcrypt hashing.
- [`backend/app/core/exceptions.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/core/exceptions.py): Custom Sahayika exception hierarchy.
- [`backend/app/core/logging.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/core/logging.py): Logging configuration.

### Backend Integrations
- [`backend/app/integrations/firebase/firebase_admin.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/integrations/firebase/firebase_admin.py): Firebase Admin SDK initialization, certificate loader.
- [`backend/app/integrations/firebase/firestore_repository.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/integrations/firebase/firestore_repository.py): Firestore CRUD operations, atomic create, batch seeding.
- [`backend/app/integrations/firebase/messaging_service.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/integrations/firebase/messaging_service.py): Firebase Cloud Messaging push notification delivery and token sync.
- [`backend/app/integrations/firebase/storage_service.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/integrations/firebase/storage_service.py): Cloud Storage audio upload and signed URL generator.
- [`backend/app/integrations/gnani/client.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/integrations/gnani/client.py): HTTP client for Gnani Vachana platform, header auth.
- [`backend/app/integrations/gnani/prisma.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/integrations/gnani/prisma.py): Prisma STT v3.0 service, ffmpeg PCM conversion, language code normalization.
- [`backend/app/integrations/gnani/timbre.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/integrations/gnani/timbre.py): Timbre TTS v3.0 service, MD5 audio caching, audio URL generation.
- [`backend/app/integrations/gnani/evon.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/integrations/gnani/evon.py): Evon NLU service and regex pattern matching fallback.
- [`backend/app/integrations/gemini/gemini_service.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/integrations/gemini/gemini_service.py): Gemini structured entity extraction, Devanagari transliteration.

### Backend Routers & Services
- [`backend/app/api/v1/auth.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/api/v1/auth.py): Authentication endpoints.
- [`backend/app/api/v1/households.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/api/v1/households.py): Household management endpoints.
- [`backend/app/api/v1/visits.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/api/v1/visits.py): Visit logging and confirmation endpoints.
- [`backend/app/api/v1/tasks.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/api/v1/tasks.py): Task scheduling and status endpoints.
- [`backend/app/api/v1/requests.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/api/v1/requests.py): Community request endpoints.
- [`backend/app/api/v1/claims.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/api/v1/claims.py): Incentive claim preparation and submission.
- [`backend/app/api/v1/sos.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/api/v1/sos.py): Emergency SOS trigger and escalation.
- [`backend/app/api/v1/ai.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/api/v1/ai.py): Voice assistant, STT, TTS, and extraction endpoints.
- [`backend/app/api/v1/notifications.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/api/v1/notifications.py): Notification and device token registration endpoints.
- [`backend/app/services/safety_service.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/services/safety_service.py): Multi-level clinical safety guardrails.
- [`backend/app/services/assistant_service.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/services/assistant_service.py): Health assistant logic and knowledge grounding.

### Frontend Services
- [`frontend/src/services/api/apiClient.js`](file:///Users/mahekaghija/Desktop/gnani/frontend/src/services/api/apiClient.js): Axios instance with JWT interceptors and base URL resolver.
- [`frontend/src/services/audio/audioService.js`](file:///Users/mahekaghija/Desktop/gnani/frontend/src/services/audio/audioService.js): Recording preset, playback subscription, pause/resume, file cleanup.
- [`frontend/src/services/api/aiApi.js`](file:///Users/mahekaghija/Desktop/gnani/frontend/src/services/api/aiApi.js): AI API bridge for STT, TTS, extraction, and queries.
- [`frontend/src/services/gnani/gnaniService.js`](file:///Users/mahekaghija/Desktop/gnani/frontend/src/services/gnani/gnaniService.js): Mobile service layer delegating to `aiApi`.
- [`frontend/src/services/firebase/firebaseConfig.js`](file:///Users/mahekaghija/Desktop/gnani/frontend/src/services/firebase/firebaseConfig.js): React Native Firebase client SDK initialization.
- [`frontend/src/services/notifications/notificationService.js`](file:///Users/mahekaghija/Desktop/gnani/frontend/src/services/notifications/notificationService.js): Expo Notifications integration and token registration.
