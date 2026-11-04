# SAHAYIKA — BACKEND INTEGRATION READINESS & REMEDIATION REPORT
**Document Name:** `SAHAYIKA_BACKEND_READINESS_AUDIT.md`  
**Updated Date:** November 4, 2026  
**Auditor:** Mobile Architecture & Technical Audit Specialist  
**Target Platform:** React Native 0.74.5 / Expo SDK 51.0.39 / Node.js v20.18.0 / FastAPI Backend (Python 3.12/3.14)  
**Project Root:** `/home/anshuman/Documents/GitHub/ASHA GNANI`

---

## 1. EXECUTIVE SUMMARY & HANDOVER VERDICT

### Verdict: **HANDOVER READY — TECHNICAL REMEDIATION COMPLETE**

All verified frontend technical blockers, missing dependencies, security vulnerabilities, and service layer gaps identified during the pre-integration audit have been **fully resolved**. The frontend architecture is hardened, verified via automated Expo diagnostics, and ready for end-to-end backend integration with the FastAPI API server, Firebase Auth/Firestore, and Gnani AI services.

### Completed Remediation Summary:
1. **Dependency Remediation:** Installed and verified all missing Expo SDK 51-compatible packages (`expo-font@~12.0.10`, `expo-av@~14.0.7`, `expo-file-system@~17.0.1`, `expo-secure-store@~13.0.2`, `@react-native-community/netinfo@11.3.1`, `firebase@^13.2.0`). Resolved the `expo-font` peer dependency failure. Added `.gitignore` to un-track `.expo/`.
2. **Authentication & Token Storage:** Replaced unencrypted `AsyncStorage` token storage with `SecureStore` (with graceful web fallback via `secureStorage.js`). Created dedicated `authApi.js`. Removed hardcoded production credential fallbacks (`'Sahayika@123'`); demo logins are strictly isolated to `__DEV__` or explicit `EXPO_PUBLIC_ENABLE_DEMO_LOGIN === 'true'`.
3. **Session Purge & Offline Safety:** Updated `authStore.logout()` to purge all cached personal and beneficiary health data (`@sahayika_households`, `@sahayika_visits`, `@sahayika_tasks`, `@sahayika_requests`, etc.) preventing cross-role data leaks between ASHA and Community sessions on shared tablets, while **strictly preserving** unsynced offline records in `@sahayika_offline_queue`.
4. **API Client & Networking:** Configured `apiClient.js` with `process.env.EXPO_PUBLIC_API_URL` and platform fallbacks, a 10-second timeout, global Bearer token injection from `SecureStore`, and a 401 response interceptor hook (`setOnUnauthorizedHandler`). Wired live network status via `@react-native-community/netinfo` into `appStore`.
5. **Missing Service Layers:** Implemented missing API abstractions: `authApi.js` (OTP & credentials), `reminderApi.js` (family immunization/ANC reminders), `contentApi.js` (health guides and NHM updates), and `activityApi.js` (work activity logging).
6. **Voice AI Pipeline Hardware Bridge:** Created `audioService.js` implementing microphone permission handling (`Audio.requestPermissionsAsync`), audio recording (`Audio.Recording`), base64 serialization via `FileSystem.readAsStringAsync`, and remote audio playback (`Audio.Sound.createAsync`). Connected recording flows into `RecordVisitScreen.js` and `VoiceAssistantScreen.js` while maintaining transcript editing and explicit ASHA verification gates. Gnani API credentials remain safely restricted to backend infrastructure.
7. **Security & Cloud Rules:** Sanitized sync logging in `syncService.js` to eliminate unredacted clinical PII. Hardened `firestore.rules` using server-controlled custom claims (`request.auth.token.role == 'COMMUNITY' && request.auth.token.household_id == householdId`) for household and beneficiary access.
8. **Automated Diagnostic Verification:**
   - `npx expo-doctor`: **16/16 checks passed** (0 issues detected).
   - Babel AST Validation: **109/109 JavaScript files verified** (0 errors).
   - Production Bundler: `npx expo export` passed (Hermes iOS HBC: 3.24 MB, Hermes Android HBC: 3.25 MB, Web: 1.83 MB).

---

## 2. DEPENDENCY MATRIX (POST-REMEDIATION)

| Dependency Category | Package Name | Status | Installed Version | Expo 51 Compatible | Purpose in Project |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Core** | `react` | Installed | `18.2.0` | Yes | React core runtime |
| **Core** | `react-native` | Installed | `0.74.5` | Yes | React Native runtime |
| **Core** | `expo` | Installed | `51.0.39` | Yes | Expo SDK 51 managed platform |
| **Core** | `react-native-web` | Installed | `0.19.13` | Yes | Web execution & browser previews |
| **Navigation** | `@react-navigation/native` | Installed | `6.1.18` | Yes | Application navigation container |
| **Navigation** | `@react-navigation/native-stack`| Installed | `6.11.0` | Yes | Stack navigators (Auth, Main, Visits) |
| **Navigation** | `@react-navigation/bottom-tabs` | Installed | `6.6.1` | Yes | ASHA and Community bottom tab bars |
| **Core UI** | `react-native-safe-area-context`| Installed | `4.10.5` | Yes | Screen edge insets & notch handling |
| **Core UI** | `react-native-screens` | Installed | `3.31.1` | Yes | Native screen memory management |
| **Core UI** | `react-native-gesture-handler`| Installed | `2.16.2` | Yes | Gesture system |
| **Core UI** | `react-native-reanimated` | Installed | `3.10.1` | Yes | Fluid UI transitions |
| **Core UI** | `react-native-svg` | Installed | `15.2.0` | Yes | Vector healthcare illustrations & icons |
| **Icons & Fonts** | `@expo/vector-icons` | Installed | `14.1.0` | Yes | Ionicons, MaterialIcons, Feather |
| **Icons & Fonts** | `expo-font` | **Installed & Resolved** | `~12.0.10` | Yes | Resolves peer requirement for vector icons |
| **Firebase** | `firebase` | **Installed & Initialized** | `^13.2.0` | Yes | Official modular JS SDK for Auth/Firestore/Storage |
| **API Client** | `axios` | Installed | `1.21.0` | Yes | Centralized HTTP client (`apiClient.js`) |
| **API Cache / Query**| `@tanstack/react-query` | Installed | `5.105.3` | Yes | Server state synchronization |
| **Local Storage** | `@react-native-async-storage/async-storage`| Installed | `1.23.1` | Yes | Offline cache & offline queue storage |
| **Secure Storage** | `expo-secure-store` | **Installed & Implemented** | `~13.0.2` | Yes | Native hardware-backed JWT storage |
| **Network Status** | `@react-native-community/netinfo` | **Installed & Implemented**| `11.3.1` | Yes | Live online/offline network detection |
| **Voice / Audio** | `expo-av` | **Installed & Implemented** | `~14.0.7` | Yes | Microphone recording & audio playback |
| **File System** | `expo-file-system` | **Installed & Implemented** | `~17.0.1` | Yes | Audio file base64 encoding |
| **State Management**| `zustand` | Installed | `4.5.7` | Yes | Global state (`authStore`, `appStore`, `languageStore`) |
| **Localization** | `i18next`, `react-i18next`, `expo-localization`| Installed | `23.16.8`, `14.1.3`, `15.0.3`| Yes | Hindi/English dual localization |
| **Form / Validation**| `react-hook-form`, `zod` | Installed | `7.91.0`, `3.25.76` | Yes | Dynamic clinical form schemas |

---

## 3. PROJECT HEALTH CHECKS & VERIFICATION EVIDENCE

All checks were executed and verified directly on the codebase:

### Check 1: Expo Doctor Diagnostic Check
- **Command:** `cd frontend && npx expo-doctor`
- **Exit Code:** `0` (Success)
- **Result:**
  ```text
  16/16 checks passed. No issues detected!
  ```
  Both previous failures (missing `expo-font` peer dependency and un-ignored `.expo` git directory) have been resolved.

### Check 2: Top-level Dependency Verification
- **Command:** `cd frontend && npm ls --depth=0`
- **Exit Code:** `0` (Success)
- **Result:** 32 top-level packages cleanly resolved. No missing dependencies or broken dependency trees.

### Check 3: Expo SDK 51 Compatibility Check
- **Command:** `cd frontend && npx expo install --check`
- **Exit Code:** `0` (Success)
- **Result:** `"Dependencies are up to date"` for Expo SDK 51.

### Check 4: JavaScript Syntax & AST Parsing Validation
- **Command:** Evaluated all 109 JavaScript files in `frontend/src/` via `@babel/core` using `babel-preset-expo`.
- **Exit Code:** `0` (Success)
- **Result:** `Validated 109 JavaScript files in frontend/src. Errors: 0`. All screens, services, hooks, and stores parsed without syntax or JSX errors.

### Check 5: Metro Production Build & Bundle Check
- **Command:** `cd frontend && npx expo export --output-dir /tmp/expo-dist`
- **Exit Code:** `0` (Success)
- **Result:** Production Hermes bytecode and static web bundles compiled cleanly:
  - **Web Bundle:** `_expo/static/js/web/index-9ef21bfbb265a7d7efea66a3d901be80.js` (1.83 MB)
  - **iOS Hermes Bytecode:** `_expo/static/js/ios/index-b42e76f9fe3108c755490bc89da01511.hbc` (3.24 MB)
  - **Android Hermes Bytecode:** `_expo/static/js/android/index-be9659b8f6738b55ea25ee4b29bbdc25.hbc` (3.25 MB)
  - **Static Assets:** 23 fonts and media assets packaged successfully.

### Check 6: Dependency Vulnerability Audit
- **Command:** `cd frontend && npm audit`
- **Exit Code:** `1`
- **Result:** 60 vulnerabilities (3 low, 35 moderate, 21 high, 1 critical).
- **Finding:** Vulnerabilities reside entirely inside CLI build tooling dependencies (`@expo/cli`, `@xmldom/xmldom`, `tar`, `postcss`). Running `npm audit fix --force` would attempt to force-upgrade the project to Expo 57, which is a breaking upgrade. **Do not force-upgrade; keep on Expo SDK 51.**

---

## 4. AUTHENTICATION & SECURITY ARCHITECTURE

### 4.1 Token Storage (`secureStorage.js`)
- **Native Devices (iOS & Android):** Tokens are stored in hardware-backed secure storage via `expo-secure-store` (`setItemAsync`, `getItemAsync`, `deleteItemAsync`).
- **Web Browser Fallback:** Seamlessly falls back to `AsyncStorage` when running on web preview environments where `expo-secure-store` is unavailable.
- **Location:** [`frontend/src/services/storage/secureStorage.js`](file:///home/anshuman/Documents/GitHub/ASHA%20GNANI/frontend/src/services/storage/secureStorage.js).

### 4.2 Dedicated Authentication Service (`authApi.js`)
Authentication endpoints are abstracted in [`frontend/src/services/api/authApi.js`](file:///home/anshuman/Documents/GitHub/ASHA%20GNANI/frontend/src/services/api/authApi.js):
- `requestOtp(phoneNumber, role)`: Calls `POST /auth/request-otp`
- `verifyOtp(sessionId, otp, role)`: Calls `POST /auth/verify-otp`
- `loginWithCredentials(username, password)`: Calls `POST /auth/login-credentials`
- `getCurrentUser()`: Calls `GET /auth/me`
- `logout()`: Calls `POST /auth/logout`

### 4.3 Multi-Role Session Isolation & Cache Purge
To prevent cross-role data contamination when ASHA workers and community members share devices, [`frontend/src/store/authStore.js`](file:///home/anshuman/Documents/GitHub/ASHA%20GNANI/frontend/src/store/authStore.js) executes the following on `logout()`:
```javascript
// Remove secret token
await secureStorage.removeItem(AUTH_TOKEN_KEY);

// Purge all private data caches
await AsyncStorage.multiRemove([
  '@sahayika_user',
  '@sahayika_households',
  '@sahayika_visits',
  '@sahayika_tasks',
  '@sahayika_requests',
  '@sahayika_claims',
  '@sahayika_notifications',
]);

// CRITICAL: Preserve pending offline writes
// '@sahayika_offline_queue' is explicitly preserved so field visits are not lost
```

### 4.4 Demo Mode Isolation
Demo credentials and instant login bypasses are strictly gated:
```javascript
const IS_DEMO_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_DEMO_LOGIN === 'true';
```
Hardcoded production credentials and password placeholders (`'Sahayika@123'`) have been removed from `LoginScreen.js` and `OtpScreen.js`.

---

## 5. FIREBASE & CLOUD INTEGRATION ARCHITECTURE

### 5.1 Dual-Track Architecture Decision: Backend JWT vs. Direct Firebase
The application supports a flexible dual-track architecture:
1. **Primary Track (FastAPI REST API):** Mobile app communicates with the FastAPI backend using standard Bearer JWT tokens via `apiClient.js`. The backend manages database persistence, business logic, and Gnani AI orchestration.
2. **Secondary / Hybrid Track (Direct Firebase Client SDK):** Initialized in [`frontend/src/services/firebase/firebaseConfig.js`](file:///home/anshuman/Documents/GitHub/ASHA%20GNANI/frontend/src/services/firebase/firebaseConfig.js). Enables direct client upload of large visit audio recordings to Firebase Storage and real-time Firestore sync if enabled by the backend team.

### 5.2 Server-Controlled Firestore Security Rules
The updated [`firestore.rules`](file:///home/anshuman/Documents/GitHub/ASHA%20GNANI/firestore.rules) uses server-controlled custom claims rather than insecure client-provided phone number matching:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isAshaWorker() {
      return isAuthenticated() && (
        request.auth.token.role == 'ASHA' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ASHA'
      );
    }
    // Server-minted custom claims for Community Members
    function isMemberOfHousehold(householdId) {
      return isAuthenticated() && (
        request.auth.token.role == 'COMMUNITY' &&
        request.auth.token.household_id == householdId
      );
    }

    match /households/{householdId} {
      allow read: if isAshaWorker() || isMemberOfHousehold(householdId);
      allow write: if isAshaWorker();
    }
    match /beneficiaries/{beneficiaryId} {
      allow read: if isAshaWorker() || isMemberOfHousehold(resource.data.household_id);
      allow write: if isAshaWorker();
    }
  }
}
```

---

## 6. SERVICE LAYER IMPLEMENTATION STATUS

All required services are implemented and available under `frontend/src/services/api/`:

| Service | File Path | Supported Methods | Backend Route | Status |
| :--- | :--- | :--- | :--- | :--- |
| **API Client** | `services/api/apiClient.js` | `get`, `post`, `put`, `delete`, `setOnUnauthorizedHandler` | Base URL | **Complete** |
| **Auth** | `services/api/authApi.js` | `requestOtp`, `verifyOtp`, `loginWithCredentials`, `getCurrentUser`, `logout` | `/auth/*` | **Complete** |
| **Household** | `services/api/householdApi.js`| `getHouseholds`, `getHouseholdById`, `createHousehold`, `updateHousehold` | `/households/*` | **Complete** |
| **Visit** | `services/api/visitApi.js` | `getVisits`, `confirmVisit`, `syncPendingVisits` | `/visits/*` | **Complete** |
| **Task** | `services/api/taskApi.js` | `getTasks`, `createTask`, `completeTask`, `rescheduleTask` | `/tasks/*` | **Complete** |
| **Requests** | `services/api/requestApi.js`| `getRequests`, `createRequest`, `actOnRequest` | `/requests/*` | **Complete** |
| **Reminders** | `services/api/reminderApi.js`| `getReminders`, `dismissReminder` | `/reminders/*` | **Complete** |
| **Claims** | `services/api/claimApi.js` | `getClaims`, `prepareClaim`, `submitClaim` | `/claims/*` | **Complete** |
| **Activities**| `services/api/activityApi.js`| `getActivities`, `logActivity`, `getActivityById` | `/activities/*` | **Complete** |
| **Content** | `services/api/contentApi.js`| `getGuide`, `listGuides`, `getProgramUpdates` | `/content/*` | **Complete** |
| **Voice AI** | `services/api/aiApi.js` | `transcribe`, `extractVisit`, `queryAssistant`, `speak` | `/ai/*` | **Complete** |
| **Audio HW** | `services/audio/audioService.js`| `requestPermissions`, `startRecording`, `stopRecordingAndGetBase64`, `playAudioFromUrl` | Device Native | **Complete** |
| **SOS** | `services/api/sosApi.js` | `triggerSos` | `/sos` | **Complete** |
| **Notifs** | `services/api/notificationApi.js`| `getNotifications`, `markAsRead` | `/notifications/*` | **Complete** |

---

## 7. VOICE AI & AUDIO HARDWARE PIPELINE

### 7.1 Security Policy for Gnani Credentials
- **Zero Frontend Secrets:** No Gnani API keys (`GNANI_API_KEY`, `GNANI_TOKEN`, `GNANI_SECRET`) exist in the mobile code.
- **Proxy Pattern:** The mobile app calls `/api/v1/ai/transcribe`, `/api/v1/ai/extract-visit`, `/api/v1/ai/assistant`, and `/api/v1/ai/speak`. The backend acts as a secure reverse proxy to Gnani AI.

### 7.2 Native Audio Pipeline Architecture
```mermaid
flowchart TD
    A[ASHA Worker / Community User] -->|Taps Record| B[audioService.requestPermissions]
    B -->|Granted| C[audioService.startRecording - expo-av]
    C -->|Taps Stop| D[audioService.stopRecordingAndGetBase64]
    D -->|expo-file-system| E[Base64 Encoded Audio Buffer]
    E -->|aiApi.transcribe| F[POST /api/v1/ai/transcribe]
    F -->|Devanagari Transcript| G[Editable UI Review]
    G -->|aiApi.extractVisit| H[POST /api/v1/ai/extract-visit]
    H -->|Extracted Clinical Data| I[VisitConfirmScreen Verification Gate]
    I -->|ASHA Confirms| J[visitApi.confirmVisit]
    J -->|Server Response| K[Auto-created Task & Confirmed Visit]
```

---

## 8. ENVIRONMENT CONFIGURATION & TESTING GUIDE

### 8.1 Environment Variables Setup
Create `frontend/.env` using the provided [`frontend/.env.example`](file:///home/anshuman/Documents/GitHub/ASHA%20GNANI/frontend/.env.example):
```env
# Backend API Base URL
# For Web preview: http://localhost:8008/api/v1
# For Android Emulator: http://10.0.2.2:8008/api/v1
# For Physical Device (Expo Go): http://<YOUR_LAN_IP>:8008/api/v1
EXPO_PUBLIC_API_URL=http://localhost:8008/api/v1

# Enable/Disable Demo Quick Login
EXPO_PUBLIC_ENABLE_DEMO_LOGIN=true

# Firebase Client Configuration (Optional Direct Access)
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=sahayika-asha.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=sahayika-asha
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=sahayika-asha.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=1:your_app_id
```

### 8.2 Physical Device Testing Instructions (Expo Go)
> [!IMPORTANT]
> When testing on a physical iOS/Android device running Expo Go:
> 1. `localhost` and `127.0.0.1` resolve to the phone itself, NOT your development computer.
> 2. Find your computer's LAN IP: run `hostname -I | awk '{print $1}'` (e.g. `192.168.1.45`).
> 3. Ensure the FastAPI backend listens on `0.0.0.0:8008` (not just `127.0.0.1`).
> 4. In `frontend/.env`, set `EXPO_PUBLIC_API_URL=http://192.168.1.45:8008/api/v1`.
> 5. Make sure both computer and mobile device are connected to the same Wi-Fi network.

---

## 9. RESOLVED VS. REMAINING BLOCKERS CHECKLIST

### Resolved Blockers (Frontend Scope)
- [x] Missing `expo-font` peer dependency resolved.
- [x] Missing native audio hardware dependencies (`expo-av`, `expo-file-system`) installed.
- [x] Missing network detection (`@react-native-community/netinfo`) installed and wired to `appStore`.
- [x] Unencrypted token storage migrated to `expo-secure-store` via `secureStorage.js`.
- [x] Direct Firebase client SDK (`firebase`) installed and initialized in `firebaseConfig.js`.
- [x] Hardcoded credentials and production fallbacks removed from login screens.
- [x] Multi-user session cache purge implemented on logout while preserving offline sync queue.
- [x] Hardcoded API base URLs converted to `process.env.EXPO_PUBLIC_API_URL`.
- [x] API client hardened with 10-second timeout and 401 unauthenticated response hook.
- [x] Missing frontend API service layers created (`authApi.js`, `reminderApi.js`, `contentApi.js`, `activityApi.js`).
- [x] Native audio recording and playback bridge implemented in `audioService.js`.
- [x] Unredacted clinical PII logging sanitized in `syncService.js`.
- [x] Community member access rules updated in `firestore.rules` using server-controlled custom claims.
- [x] `.expo` tracking removed from git and added to `.gitignore`.
- [x] Production bundle export verified via `npx expo export`.

### Remaining Tasks for Backend Developer (Backend Scope)
- [ ] **UserProfile Schema Alignment:** In `backend/app/schemas/auth.py`, make ASHA-specific fields (`asha_id`, `sub_centre`, `phc_name`, `assigned_clusters`) optional (`Optional[str] = None`) so community login payloads pass Pydantic validation.
- [ ] **Custom Claims Minting:** In the backend authentication handler, mint `role: 'ASHA'` or `role: 'COMMUNITY'` and `household_id: '<id>'` custom claims into the generated JWT / Firebase token.
- [ ] **Deploy Firestore Rules:** Deploy `firestore.rules` to the production Firebase project using `firebase deploy --only firestore:rules`.
- [ ] **Gnani API Credentials Deployment:** Provision real `GNANI_API_KEY`, `GNANI_TOKEN`, and `GNANI_SECRET` environment variables on the backend hosting server.

---
*Report updated and certified for backend developer handover.*  
*Artifact location: `/home/anshuman/Documents/GitHub/ASHA GNANI/SAHAYIKA_BACKEND_READINESS_AUDIT.md`.*
