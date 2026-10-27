#!/usr/bin/env bash
# Lint and type-check backend and frontend.
source "$(dirname "$0")/_common.sh"
cd "$ROOT/backend"
"$PY" -m ruff check .
"$PY" -m ruff format --check .
"$PY" -m mypy app
cd "$ROOT/frontend"
npm run lint
npm run typecheck
