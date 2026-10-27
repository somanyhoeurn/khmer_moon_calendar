#!/usr/bin/env bash
# Run backend (uvicorn --reload) and frontend (next dev) without Docker. Ctrl+C stops both.
source "$(dirname "$0")/_common.sh"
cd "$ROOT"
trap 'kill 0' EXIT INT TERM
(cd backend && "$PY" -m uvicorn app.main:app --reload --port 8087) &
(cd frontend && npm run dev) &
wait
