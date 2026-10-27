# Development image for the FastAPI backend (used by the root docker-compose.yml).
# Production uses infra/docker/backend.Dockerfile.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
COPY requirements.txt requirements-dev.txt ./
RUN pip install -r requirements-dev.txt

COPY . .
RUN pip install --no-deps -e . \
    && useradd --create-home --uid 10001 app \
    && chown -R app /app
USER app

EXPOSE 8087
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8087 --reload"]
