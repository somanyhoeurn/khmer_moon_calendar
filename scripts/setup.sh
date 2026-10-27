#!/usr/bin/env bash
# Install backend (virtualenv) and frontend dependencies, then migrate and seed a local database.
source "$(dirname "$0")/_common.sh"
cd "$ROOT"

[[ -f .env ]] || { cp .env.example .env; echo "Created .env from .env.example - edit the placeholders."; }

echo "==> Backend dependencies"
BASE_PY="$(command -v python3 || command -v python)"
[[ -d backend/.venv ]] || "$BASE_PY" -m venv backend/.venv
source "$(dirname "$0")/_common.sh"
"$PY" -m pip install --upgrade pip >/dev/null
"$PY" -m pip install -r backend/requirements-dev.txt
"$PY" -m pip install --no-deps -e backend

echo "==> Frontend dependencies"
npm ci --prefix frontend
npm install --no-audit --no-fund

echo "==> Database migrations and verified seed data"
(cd backend && "$PY" -m alembic upgrade head && "$PY" -m app.db.seed)
echo "Setup complete. Run 'make dev' (local) or 'make up' (Docker)."
