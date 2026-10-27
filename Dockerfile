# Backend image for platforms that build ./Dockerfile from the repository root (e.g. Render).
# Same image as infra/docker/backend.Dockerfile, but the container prepares the database itself:
# migrations and the verified seed data are idempotent, so they run on every start.
#   docker build -t khmer-moon-calendar-backend .

FROM python:3.13-slim AS builder
ENV PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /build
COPY backend/requirements.txt .
RUN python -m venv /opt/venv && /opt/venv/bin/pip install -r requirements.txt
COPY backend/pyproject.toml backend/README.md ./
COPY backend/app ./app
RUN /opt/venv/bin/pip install --no-deps .

FROM python:3.13-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    ENVIRONMENT=production \
    SEED_DATA_DIR=/app/seeds \
    PORT=8087
WORKDIR /app
RUN useradd --create-home --uid 10001 app
COPY --from=builder /opt/venv /opt/venv
COPY backend/alembic.ini ./
COPY backend/migrations ./migrations
COPY infra/database/seeds ./seeds
USER app

EXPOSE 8087
# Shell form so $PORT (set by the platform) is expanded.
CMD alembic upgrade head && python -m app.db.seed && \
    exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --workers 1 --proxy-headers --forwarded-allow-ips '*'
