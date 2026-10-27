#!/usr/bin/env bash
# Shared helpers: resolve repository root and the backend Python interpreter.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -x "$ROOT/backend/.venv/bin/python" ]]; then
  PY="$ROOT/backend/.venv/bin/python"
elif [[ -x "$ROOT/backend/.venv/Scripts/python.exe" ]]; then
  PY="$ROOT/backend/.venv/Scripts/python.exe"
else
  PY="$(command -v python3 || command -v python)"
fi
export ROOT PY
