# SAHAYIKA Security Architecture & Contributor Guidelines

This repository implements **multi-tier defense-in-depth protection** to guarantee that API keys, private keys, service account credentials, JWT secrets, database dumps, and sensitive configurations are **never** accidentally committed or pushed to GitHub.

---

## 1. Multi-Tier Security Overview

```
                      DEVELOPER MACHINE
   +---------------------------------------------------------+
   | 1. Source Code & Config Isolation                       |
   |    - No hardcoded keys in source code                   |
   |    - Backend loads exclusively from backend/.env        |
   |    - Frontend loads via Expo EXPO_PUBLIC_* env vars     |
   |    - Strict startup validation (refuses weak prod keys) |
   +---------------------------------------------------------+
                               |
                               v
   +---------------------------------------------------------+
   | 2. Multi-Tier Git Ignore Rules                          |
   |    - Root .gitignore                                    |
   |    - backend/.gitignore                                 |
   |    - frontend/.gitignore                                |
   |    - Protects even if someone runs: `git add .`         |
   +---------------------------------------------------------+
                               |
                               v
   +---------------------------------------------------------+
   | 3. Pre-Commit Hook (.githooks/pre-commit)               |
   |    - Runs before commit is created                      |
   |    - Scans staged Git index for secrets & private files |
   |    - Fully redacts secret values in error messages      |
   +---------------------------------------------------------+
                               |
                               v
   +---------------------------------------------------------+
   | 4. Pre-Push Hook (.githooks/pre-push)                   |
   |    - Scans outgoing commit range before remote push     |
   |    - Rejects push if historical or new commit has key   |
   +---------------------------------------------------------+
                               |
                               v
                          REMOTE GITHUB
   +---------------------------------------------------------+
   | 5. GitHub CI & Push Protection                          |
   |    - GitHub Actions Security Scan (.github/workflows)   |
   |    - GitHub Secret Scanning & Push Protection (Server)  |
   +---------------------------------------------------------+
```

---

## 2. Quick Contributor Setup (1 Single Command)

To activate local Git security hooks on any fresh clone:

```bash
./scripts/setup-git-hooks.sh
```

This sets `git config core.hooksPath .githooks` and ensures all commits and pushes are guarded.

---

## 3. Environment & Secrets Setup

### Backend (`backend/`)
1. Copy the example configuration template:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Populate the required keys in `backend/.env` (which is permanently gitignored):
   - `SECRET_KEY`: A cryptographically secure secret (minimum 32 characters).
   - `GNANI_API_KEY`: Your Gnani Vachana platform API key.
   - `FIREBASE_CREDENTIALS_PATH`: Path to your service account JSON (e.g. `secrets/firebase-service-account.json`).
3. Store Firebase service account keys strictly in:
   ```
   backend/secrets/firebase-service-account.json
   ```
   This folder is recursively ignored across all `.gitignore` tiers.

### Frontend (`frontend/`)
1. Copy the frontend template:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
2. Populate client identifiers in `frontend/.env`:
   - `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `EXPO_PUBLIC_API_BASE_URL` (optional; defaults to auto-resolved local backend)
3. For Android build configuration, `frontend/google-services.json` is strictly ignored by Git.

---

## 4. Invariants (Never Modify)

- **Demo Credentials:** The demo password `Sahayika@123` and demo user ID `asha_sunita_001` are permitted exclusively in development and demo modes.
- **Authentication Bypass:** The `demo_token` authentication bypass is retained when `DEMO_MODE=True` and `ENVIRONMENT != "production"`. In production, demo mode is strictly disallowed.

---

## 5. Enabling GitHub Repository-Side Protections

Because local Git hooks can be bypassed (e.g. via `--no-verify`), the following repository settings should be enabled on the GitHub repository:

1. Navigate to your repository on GitHub: **Settings** -> **Code security and analysis**.
2. **Secret Scanning**: Click **Enable**.
3. **Push Protection**: Click **Enable**.
   - With Push Protection enabled, GitHub's server will reject any push that contains known tokens or keys, preventing exposure even if a contributor did not run the local setup script.
4. **Branch Protection Rules**: Under **Settings** -> **Branches**, require the `Gitleaks & Secret Scanner` workflow to pass before any pull request can be merged into `main`.
