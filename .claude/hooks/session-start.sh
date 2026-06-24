#!/bin/bash
# SessionStart hook for Claude Code on the web.
#
# This is a build-less static site (React + Babel loaded from CDN, .jsx files
# transpiled in the browser) with a plain-PHP backend, so there are no runtime
# dependencies to install. The only thing web sessions need set up is the
# dev-only syntax linter under tools/lint, which catches .jsx/PHP errors that
# would otherwise only appear at runtime.
set -euo pipefail

# Only run in the remote (web) environment; do nothing on local machines.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$ROOT"

echo "[session-start] Installing lint tooling (tools/lint)…"
# npm install (not ci) so the cached container layer is reused on later runs.
npm install --prefix tools/lint --no-audit --no-fund

echo "[session-start] Toolchain check:"
command -v python3 >/dev/null && echo "  python3: $(python3 --version 2>&1)  (static server: python3 -m http.server 5544)"
command -v php >/dev/null && echo "  php:     $(php --version 2>&1 | head -n1)" || echo "  php: not found (backend lint via php -l will be skipped)"
command -v node >/dev/null && echo "  node:    $(node --version)"

echo "[session-start] Done. Lint with: npm run lint --prefix tools/lint"
