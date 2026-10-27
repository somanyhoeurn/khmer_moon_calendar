# Khmer Moon Calendar – backend

FastAPI service exposing `/api/v1`: Khmer lunar dates, conversions, holidays, events and search.

```
app/
├── main.py              app factory, CORS, request logging
├── api/                 routers (v1/endpoints/*) and dependency wiring (deps.py)
├── core/                settings, JSON logging, error envelope
├── domain/calendar/     chhankitek.py (algorithm), engine.py (boundary), formatting, validation
├── domain/holidays/     lunar observance rules
├── services/            calendar, lunar date, conversion, holiday use cases
├── db/                  engine/session, repositories, seed loader
├── models/              SQLAlchemy models + enums
└── schemas/             Pydantic response models
migrations/              Alembic
tests/                   unit / integration / api (+ fixtures from published references)
```

## Run

```bash
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt && pip install --no-deps -e .
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload
```

Configuration comes from environment variables (see `app/core/config.py` and the root `.env.example`): `DATABASE_URL`, `CORS_ORIGINS`, `ENVIRONMENT`, `LOG_LEVEL`, `LOG_FORMAT`, `TIMEZONE` and `SEED_DATA_DIR`.

## Quality

```bash
ruff check . && ruff format --check .
mypy app
pytest                       # SQLite in-memory
TEST_DATABASE_URL=postgresql+psycopg://… pytest   # PostgreSQL
```

`requirements.txt` and `requirements-dev.txt` are the pinned lockfiles; `pyproject.toml` holds compatible ranges and tool configuration.
