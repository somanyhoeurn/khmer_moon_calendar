# Production image for the FastAPI backend.
# Build context: repository root (so verified seed data can be included).
#   docker build -f infra/docker/backend.Dockerfile -t khmer-moon-calendar-backend .

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
    SEED_DATA_DIR=/app/seeds
WORKDIR /app
RUN useradd --create-home --uid 10001 app
COPY --from=builder /opt/venv /opt/venv
COPY backend/alembic.ini ./
COPY backend/migrations ./migrations
COPY infra/database/seeds ./seeds
USER app

EXPOSE 8087
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8087/api/v1/health', timeout=4).status == 200 else 1)"
# Migrations run as a separate one-off step in production (see docs/deployment/production.md).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8087", "--workers", "2", "--proxy-headers", "--forwarded-allow-ips", "*"]
