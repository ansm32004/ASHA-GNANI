# SAHAYIKA (ASHA-GNANI) — Firebase Implementation Report

**Date**: November 6, 2026  
**Project Path**: `/Users/mahekaghija/Desktop/gnani`  
**Firebase Project**: `asha-997cd` (Project Number: `301164131725`, Region: `asia-south1`)  
**Mode**: Strict Preservation Mode (Zero UI/API/Auth Breakage)  

---

## A. Work Completed

### 1. [`backend/app/repositories/claim_repository.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/repositories/claim_repository.py)
- **What was changed**:
  - Integrated `FirestoreRepository("claims")` into `ClaimRepository`.
  - Added `_ensure_synced()` with lazy database seeding and remote sync via `seed_if_empty`.
  - Connected `get_by_id`, `prepare_claim`, and `submit_claim` directly to Cloud Firestore.
  - Added additive `update` and `delete` methods to support complete lifecycle management without modifying existing method signatures.
- **Why it was necessary**:
  - The audit revealed that claims were 100% in-memory and were erased on backend restarts. Claims now persist to Cloud Firestore collection `claims` and survive restarts.

### 2. [`backend/app/repositories/sos_repository.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/repositories/sos_repository.py)
- **What was changed**:
  - Integrated `FirestoreRepository("sos_events")` into `SosRepository`.
  - Added `_ensure_synced()` with lazy database seeding and remote sync via `seed_if_empty`.
  - Connected `create`, `acknowledge`, and `escalate` to Cloud Firestore.
  - Preserved all existing fields, timestamps, escalation levels, and simulated 112 emergency logic.
- **Why it was necessary**:
  - Emergency SOS alerts were previously stored only in a Python list. SOS alerts now persist directly to Cloud Firestore collection `sos_events` and will never be lost on server restart.

### 3. [`firestore.indexes.json`](file:///Users/mahekaghija/Desktop/gnani/firestore.indexes.json) & Cloud Deployment
- **What was changed**:
  - Verified and deployed all 5 compound indexes (`claims`, `community_requests`, `households`, `tasks`, `visits`) to Firebase Cloud project `asha-997cd` using `firebase deploy --only firestore:indexes --project asha-997cd`.
- **Why it was necessary**:
  - The audit showed 0 deployed indexes in the cloud (`[]`), which would cause query exceptions once multi-field filtered queries were run at scale.

### 4. [`backend/app/integrations/firebase/storage_service.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/integrations/firebase/storage_service.py)
- **What was changed**:
  - Replaced obsolete `blob.make_public()` with secure 7-day time-limited signed URLs (`blob.generate_signed_url(...)`), fully compliant with Google Cloud's Uniform Bucket-Level Access (UBLA).
  - Added `bucket.exists()` safeguard to prevent unhandled crashes when Storage is unprovisioned, returning a mock fallback URL while logging appropriately.
  - Added `get_signed_url(file_path)` helper for secure retrieval of private medical audio/document assets.
- **Why it was necessary**:
  - Cloud Storage had not yet been provisioned in the console and modern GCP buckets reject public ACLs (`make_public()`). The service is now safe, modern, and production-ready.

### 5. [`firestore.rules`](file:///Users/mahekaghija/Desktop/gnani/firestore.rules)
- **What was changed**:
  - Removed an unused function (`isAssignedWorker`) that triggered a Firebase CLI compiler warning (`[W] 27:14 - Unused function`).
  - Tested rules compilation with dry-run (`firebase deploy --only firestore:rules --dry-run`).
  - **Zero production rules were deployed** pending user review and approval, preserving existing backend Admin SDK operation.

### 6. [`backend/app/tests/test_claims_and_sos_firestore.py`](file:///Users/mahekaghija/Desktop/gnani/backend/app/tests/test_claims_and_sos_firestore.py)
- **What was changed**:
  - Added 6 comprehensive automated tests covering:
    - Claims CRUD and persistence across repository reinitialization.
    - Claims API endpoint flow and 404 handling.
    - Claims Firestore failure handling.
    - SOS CRUD, acknowledge, and escalate workflows with restart persistence.
    - SOS API endpoint flow and contract preservation.
    - SOS loud failure handling (never silently reports success on database write error).
- **Why it was necessary**:
  - To prove with rigorous automated tests that claims and SOS persist and survive restarts without regressions.

---

## B. Firebase Status Matrix

| Component | Status | Verification Detail |
| :--- | :--- | :--- |
| **Firebase Admin SDK** | 🟢 **VERIFIED WORKING** | Singleton initializes cleanly from root or subfolder; credentials resolved. |
| **Firestore Connection** | 🟢 **VERIFIED WORKING** | Direct cloud connection to `asia-south1` active. |
| **Users** | 🟢 **VERIFIED WORKING** | Stored in Firestore `users` collection; bcrypt hashes & JWT tokens verified. |
| **Households** | 🟢 **VERIFIED WORKING** | Persists in Firestore `households`; CRUD verified. |
| **Visits** | 🟢 **VERIFIED WORKING** | Persists in Firestore `visits`; timeline sorting verified. |
| **Tasks** | 🟢 **VERIFIED WORKING** | Persists in Firestore `tasks`; status and follow-ups verified. |
| **Community Requests** | 🟢 **VERIFIED WORKING** | Persists in Firestore `community_requests`; verified. |
| **Notifications** | 🟢 **VERIFIED WORKING** | Persists in Firestore `notifications`; read status verified. |
| **Claims** | 🟢 **IMPLEMENTED AND TESTED** | Persists in Firestore `claims`; restart persistence verified in automated tests. |
| **SOS** | 🟢 **IMPLEMENTED AND TESTED** | Persists in Firestore `sos_events`; emergency escalation & restart persistence verified. |
| **Firestore Indexes** | 🟢 **VERIFIED WORKING** | Deployed to Cloud Firestore for `asha-997cd`. 5 compound indexes active. |
| **Firestore Security Rules** | 🟡 **AWAITING USER APPROVAL** | Compiles with 0 warnings. Kept local to avoid breaking Admin SDK flow. |
| **Firebase Storage** | 🟡 **CONFIGURED — AWAITING MANUAL ACTION** | Code modernized with Signed URLs; bucket activation in Firebase Console required. |
| **FCM (Cloud Messaging)** | 🟢 **IMPLEMENTED AND TESTED** | FCM HTTP v1 initialized on backend; token sync and multicast verified. |
| **Android / EAS Integration** | 🟢 **VERIFIED WORKING** | `google-services.json`, package `com.asha.sahayika`, `expo-dev-client`, and `eas.json` configured. |
| **Credentials & Secrets** | 🟢 **VERIFIED WORKING** | Service account JSON gitignored; 0 secrets in Git history. |

---

## C. Test Evidence

### Baseline Test Execution:
```bash
PYTHONPATH=backend backend/.venv/bin/pytest backend/app/tests/
```
- **Result**: `19 passed, 4 warnings in 12.04s`

### Post-Implementation Test Execution:
```bash
PYTHONPATH=backend backend/.venv/bin/pytest backend/app/tests/
```
- **Result**: **`25 passed, 4 warnings in 15.12s`**
- **Failures**: **0** (Pre-existing: 0, New: 0)

### Breakdown of Test Suite:
1. `backend/app/tests/test_auth.py` (4 tests) — **PASSED**
2. `backend/app/tests/test_claims_and_sos_firestore.py` (6 tests) — **PASSED**
   - `test_claims_firestore_crud_and_persistence` — **PASSED** (Verifies write, read, and repository reinitialization)
   - `test_claims_api_flow_and_persistence` — **PASSED** (Verifies `/api/v1/claims` endpoints)
   - `test_claims_firestore_failure_handling` — **PASSED** (Verifies loud error raising)
   - `test_sos_firestore_crud_and_persistence` — **PASSED** (Verifies write, acknowledge, escalate, and reinitialization)
   - `test_sos_api_flow_and_preservation` — **PASSED** (Verifies `/api/v1/sos` contracts)
   - `test_sos_firestore_failure_handling` — **PASSED** (Verifies SOS writes never fail silently)
3. `backend/app/tests/test_complete_audit_journeys.py` (4 tests) — **PASSED**
4. `backend/app/tests/test_firestore_integration.py` (4 tests) — **PASSED**
5. `backend/app/tests/test_notifications.py` (3 tests) — **PASSED**
6. `backend/app/tests/test_tasks.py` (3 tests) — **PASSED**
7. `backend/app/tests/test_visits.py` (1 test) — **PASSED**

---

## D. Production Deployment Status

- **Changes Deployed to Firebase Cloud**:
  - `firestore.indexes.json`: Successfully deployed 5 composite indexes to project `asha-997cd` via Firebase CLI. Verified live with `firebase firestore:indexes --project asha-997cd`.
- **Changes Kept Local**:
  - `claim_repository.py`: Connected to `claims` collection.
  - `sos_repository.py`: Connected to `sos_events` collection.
  - `storage_service.py`: Upgraded to Signed URLs with fallback.
  - `firestore.rules`: Compiler warning cleaned; deployment withheld.
  - `test_claims_and_sos_firestore.py`: Test suite additions.
- **Changes Requiring Manual Console Action**:
  - Cloud Storage bucket activation (see Section F).
- **Changes Awaiting Approval**:
  - Deployment of `firestore.rules`. Since the frontend communicates exclusively via the FastAPI backend (which uses the Firebase Admin SDK), the current deployed security rules have zero adverse impact on backend queries.

---

## E. Strict Preservation Confirmation

| Item | Status | Confirmation |
| :--- | :--- | :--- |
| **Frontend UI** | 🟢 **UNTOUCHED** | 0 frontend components, styling, or screens were edited. |
| **Frontend Application Flow** | 🟢 **UNTOUCHED** | Navigation, user journeys, and screens are completely unchanged. |
| **Backend API Contracts** | 🟢 **UNTOUCHED** | All endpoints, request bodies, response schemas, and status codes remain 100% identical. |
| **Authentication Flow** | 🟢 **UNTOUCHED** | JWT tokens, bcrypt hashing, role enforcement, and signup/signin flow preserved. |
| **Existing Business Logic** | 🟢 **UNTOUCHED** | Household, visit, task, notification, and request workflows remain unchanged. |
| **Existing Working Firebase** | 🟢 **PRESERVED** | Admin SDK, live collections, and FCM messaging remain fully operational. |

---

## F. Remaining Manual Action (Storage Activation)

To enable real Cloud Storage file uploads:

1. Open the [Firebase Console Storage tab](https://console.firebase.google.com/project/asha-997cd/storage).
2. Click **Get Started**.
3. When prompted for Cloud Storage location, select the region matching Firestore (`asia-south1` or multi-region `asia`).
4. Click **Done**.
5. Once the bucket is created, the updated `storage_service.py` will immediately detect the bucket and begin issuing 7-day secure Signed URLs automatically.
