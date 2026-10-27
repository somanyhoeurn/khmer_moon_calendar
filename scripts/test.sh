#!/usr/bin/env bash
# Run backend and frontend unit/integration tests (E2E: npm run test:e2e with the stack running).
source "$(dirname "$0")/_common.sh"
(cd "$ROOT/backend" && "$PY" -m pytest "$@")
(cd "$ROOT/frontend" && npm test)
