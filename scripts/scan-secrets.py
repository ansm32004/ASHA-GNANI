#!/usr/bin/env python3
"""
SAHAYIKA Pre-Commit & Pre-Push Secret Scanner
=============================================
Scans staged Git files or outgoing commits for private keys, credentials,
API tokens, and sensitive files before they can be committed or pushed.

All secret values are strictly REDACTED in output.
"""

import sys
import os
import re
import subprocess
from typing import List, Tuple, Dict, Any

# Sensitive file patterns that should NEVER be staged or committed
SENSITIVE_FILENAME_PATTERNS = [
    re.compile(r"(^|/)\.env($|\..*)", re.IGNORECASE),
    re.compile(r".*\.env($|\..*)", re.IGNORECASE),
    re.compile(r".*service-account.*\.json$", re.IGNORECASE),
    re.compile(r".*serviceAccountKey.*\.json$", re.IGNORECASE),
    re.compile(r".*google-services\.json$", re.IGNORECASE),
    re.compile(r".*GoogleService-Info\.plist$", re.IGNORECASE),
    re.compile(r".*\.pem$", re.IGNORECASE),
    re.compile(r".*\.key$", re.IGNORECASE),
    re.compile(r".*\.pkcs12$", re.IGNORECASE),
    re.compile(r".*\.p12$", re.IGNORECASE),
    re.compile(r".*\.pfx$", re.IGNORECASE),
    re.compile(r".*\.keystore$", re.IGNORECASE),
    re.compile(r".*\.jks$", re.IGNORECASE),
    re.compile(r".*revoked_tokens\.json$", re.IGNORECASE),
    re.compile(r"(^|/)secrets/.*", re.IGNORECASE),
    re.compile(r"(^|/)id_rsa.*", re.IGNORECASE),
    re.compile(r"(^|/)id_ed25519.*", re.IGNORECASE),
]

# Explicit file whitelists (safe package lockfiles only)
WHITELISTED_FILES = [
    "package-lock.json",
    "frontend/package-lock.json",
    "yarn.lock",
]

# Known legitimate demo and placeholder values permitted in codebase
# Matched strictly against the extracted secret value itself
WHITELISTED_PATTERNS = [
    re.compile(r"^your-[a-zA-Z0-9_-]+-here$", re.IGNORECASE),
    re.compile(r"^your-secret-key-here$", re.IGNORECASE),
    re.compile(r"^your-gnani-api-key-here$", re.IGNORECASE),
    re.compile(r"^your-gemini-api-key-here$", re.IGNORECASE),
    re.compile(r"^your-firebase-[a-zA-Z0-9_-]+$", re.IGNORECASE),
    re.compile(r"^Sahayika@123$"),           # User invariant: Demo password retained
    re.compile(r"^demo_token$"),             # User invariant: Demo token bypass retained
    re.compile(r"^mock_jwt_token_asha$"),    # Demo token
    re.compile(r"^demo_token_asha_sunita_001$"),  # Exact demo token
    re.compile(r"^demo_token_comm_meena_001$"),  # Exact demo token
    re.compile(r"^asha_sunita_001$"),        # Demo user ID
    re.compile(r"^DUMMY_TEST_KEY_NOT_REAL$"),# Specific test fixture dummy key only
]

# Secret detection rules
SECRET_RULES: List[Tuple[str, re.Pattern]] = [
    (
        "Private Key Header",
        re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----")
    ),
    (
        "Firebase / Google Cloud Private Key Field",
        re.compile(r'"private_key":\s*"-----BEGIN')
    ),
    (
        "Google Web/API Key",
        re.compile(r"\bAIzaSy[0-9A-Za-z_-]{33,}\b")
    ),
    (
        "Signed JWT Token",
        # Match real signed JWT tokens (header.payload.signature)
        re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")
    ),
    (
        "AWS Access Key ID",
        re.compile(r"\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16,}\b")
    ),
    (
        "GitHub Personal Access Token",
        re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b")
    ),
    (
        "GitHub Fine-grained PAT",
        re.compile(r"\bgithub_pat_[A-Za-z0-9_]{82,}\b")
    ),
    (
        "Slack Token",
        re.compile(r"\bxox[baprs]-[0-9]{10,}-[a-zA-Z0-9-]+\b")
    ),
    (
        "Stripe Live API Key",
        re.compile(r"\bsk_live_[0-9a-zA-Z]{24,}\b")
    ),
    (
        "Generic Hardcoded API Secret Assignment",
        re.compile(r'(?:api_key|apikey|secret_key|secret|password|private_key|token|key)\s*[:=]\s*["\']([a-zA-Z0-9_\-+/]{20,})["\']', re.IGNORECASE)
    ),
]

def is_whitelisted_file(filepath: str) -> bool:
    norm = filepath.replace("\\", "/").strip()
    for w in WHITELISTED_FILES:
        if norm == w or norm.endswith("/" + w):
            return True
    return False

def is_safe_template_file(filepath: str) -> bool:
    norm = filepath.replace("\\", "/").strip().lower()
    return norm.endswith(".example") or norm.endswith(".template") or ".env.example" in norm

def is_whitelisted_match(text: str) -> bool:
    s = text.strip().strip('"').strip("'")
    for wp in WHITELISTED_PATTERNS:
        if wp.fullmatch(s):
            return True
    return False

def check_filename(filepath: str) -> List[str]:
    violations = []
    if is_whitelisted_file(filepath) or is_safe_template_file(filepath):
        return violations
    norm = filepath.replace("\\", "/").strip()
    for pattern in SENSITIVE_FILENAME_PATTERNS:
        if pattern.search(norm):
            violations.append(f"Sensitive file pattern blocked from commit: {norm}")
    return violations

def check_file_content(filepath: str, content: str) -> List[Dict[str, Any]]:
    violations = []
    # Note: Safe template files are NOT excluded here; their contents are strictly scanned.
    if is_whitelisted_file(filepath):
        return violations

    lines = content.splitlines()
    for line_num, line in enumerate(lines, start=1):
        for rule_name, rule_regex in SECRET_RULES:
            matches = rule_regex.findall(line)
            for m in matches:
                matched_str = m if isinstance(m, str) else m[0]
                # ONLY check whitelist on the matched secret itself, never on the whole line!
                if is_whitelisted_match(matched_str):
                    continue
                violations.append({
                    "rule": rule_name,
                    "line": line_num,
                    "match_length": len(matched_str),
                })
    return violations

def scan_staged_files() -> int:
    """Scan all files staged in the Git index (for pre-commit)."""
    try:
        cmd = ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"]
        staged_files = subprocess.check_output(cmd, text=True).splitlines()
    except subprocess.CalledProcessError as e:
        print(f"Error querying git staged files: {e}", file=sys.stderr)
        return 1

    total_violations = 0
    for f in staged_files:
        f = f.strip()
        if not f:
            continue

        # 1. Check filename
        fn_violations = check_filename(f)
        if fn_violations:
            for v in fn_violations:
                print(f"\n[SECURITY VIOLATION] {v}")
                print(f"  --> File: {f}")
                print("  --> Reason: File matches sensitive pattern and must remain local.")
                total_violations += 1
            continue

        # 2. Check staged content directly from git blob
        try:
            content = subprocess.check_output(["git", "show", f":{f}"], text=True, errors="replace")
        except Exception:
            continue

        content_violations = check_file_content(f, content)
        for cv in content_violations:
            print(f"\n[SECURITY VIOLATION] Potential secret detected in staged file!")
            print(f"  --> File: {f} (Line {cv['line']})")
            print(f"  --> Rule: {cv['rule']}")
            print(f"  --> Detected secret string: [REDACTED - length {cv['match_length']} chars]")
            total_violations += 1

    if total_violations > 0:
        print("\n" + "=" * 70)
        print("COMMIT REJECTED: Potential private keys or secrets found in staged files.")
        print("Never commit API keys, private keys, .env files or tokens to Git.")
        print("To unstage the sensitive file, run:")
        print("   git reset HEAD <file>")
        print("Then verify your .env / local configuration.")
        print("=" * 70 + "\n")
        return 1

    return 0

def scan_commits(rev_range: str) -> int:
    """Scan commit range (for pre-push)."""
    commits = []
    try:
        commits = subprocess.check_output(["git", "rev-list", rev_range], text=True).splitlines()
    except subprocess.CalledProcessError as e:
        print(f"[SECURITY WARNING] Unable to resolve commit range '{rev_range}': {e}", file=sys.stderr)
        # Attempt fallback to origin/main..HEAD
        try:
            commits = subprocess.check_output(["git", "rev-list", "origin/main..HEAD"], text=True).splitlines()
            print("[SECURITY NOTICE] Fallback to scanning 'origin/main..HEAD'.", file=sys.stderr)
        except Exception:
            try:
                commits = subprocess.check_output(["git", "rev-list", "-n", "10", "HEAD"], text=True).splitlines()
                print("[SECURITY NOTICE] Fallback to scanning recent 10 commits on HEAD.", file=sys.stderr)
            except Exception as e2:
                print(f"[SECURITY FATAL] Could not resolve any commits to scan: {e2}", file=sys.stderr)
                return 1

    total_violations = 0
    for commit in commits:
        commit = commit.strip()
        if not commit:
            continue
        try:
            files = subprocess.check_output(
                ["git", "diff-tree", "--no-commit-id", "--name-only", "-r", commit],
                text=True
            ).splitlines()
        except Exception:
            continue

        for f in files:
            f = f.strip()
            if not f or is_whitelisted_file(f):
                continue

            fn_violations = check_filename(f)
            if fn_violations:
                for v in fn_violations:
                    print(f"\n[SECURITY VIOLATION IN COMMIT {commit[:8]}] {v}")
                    total_violations += 1
                continue

            try:
                content = subprocess.check_output(["git", "show", f"{commit}:{f}"], text=True, errors="replace")
            except Exception:
                continue

            cvs = check_file_content(f, content)
            for cv in cvs:
                print(f"\n[SECURITY VIOLATION IN COMMIT {commit[:8]}] Secret detected!")
                print(f"  --> File: {f} (Line {cv['line']})")
                print(f"  --> Rule: {cv['rule']}")
                print(f"  --> Detected value: [REDACTED - length {cv['match_length']} chars]")
                total_violations += 1

    if total_violations > 0:
        print("\n" + "=" * 70)
        print("PUSH REJECTED: Outgoing commits contain detected secrets or private files.")
        print("Please rewrite your local commits to remove secrets before pushing.")
        print("=" * 70 + "\n")
        return 1

    return 0

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--commits":
        range_arg = sys.argv[2] if len(sys.argv) > 2 else "origin/main..HEAD"
        sys.exit(scan_commits(range_arg))
    else:
        sys.exit(scan_staged_files())
