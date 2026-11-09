#!/usr/bin/env bash
# ==============================================================================
# SAHAYIKA Contributor Security Setup Script
# ==============================================================================
# Configures local Git repository hooks to prevent committing or pushing
# secrets, private keys, service account credentials, or environment files.
#
# Usage:
#   ./scripts/setup-git-hooks.sh
# ==============================================================================
set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

echo "🔐 Configuring SAHAYIKA Git Security Hooks..."

# 1. Make hook scripts executable
chmod +x "$REPO_ROOT/.githooks/pre-commit" "$REPO_ROOT/.githooks/pre-push" "$REPO_ROOT/scripts/scan-secrets.py"

# 2. Point Git to use the version-controlled .githooks directory
git config core.hooksPath .githooks

echo "✅ Git hooks path set to: $(git config core.hooksPath)"
echo "✅ Pre-commit hook: ACTIVE (scans staged files for secrets before commit)"
echo "✅ Pre-push hook:   ACTIVE (scans outgoing commits for secrets before push)"

# 3. Check for Gitleaks
if command -v gitleaks >/dev/null 2>&1; then
    echo "✅ Gitleaks detected: $(gitleaks version)"
else
    echo "ℹ️  Gitleaks binary not found (optional). Built-in Python secret scanner is fully active."
    echo "   To optionally install Gitleaks on macOS: brew install gitleaks"
fi

echo ""
echo "🎉 Setup complete! All future commits and pushes in this clone will be guarded."
