# Security guidelines

## Secrets

- Secrets live only in environment variables or `.env` (git-ignored). `.env.example` contains placeholders only.
- Compose refuses to start without `POSTGRES_PASSWORD` (`:?` guards). No credentials are hard-coded in code or images.
- Never paste real credentials into issues, logs or AI tools.

## Input validation

- Every query and path parameter is validated by FastAPI and Pydantic: ISO dates, year 1900–2100, month 1–12, lunar day 1–15, enumerated month ids and phases, slug pattern, search length 2–100, and pagination limits.
- Frontend forms validate with Zod before calling the API. The backend validates again.
- Search uses SQLAlchemy bound parameters with escaped `LIKE` wildcards. There is no string-built SQL.
- JSON-LD output escapes `<` to prevent script injection.

## Transport and HTTP

- The API is read-only: CORS allows only `GET` from `CORS_ORIGINS`, and Nginx denies other methods on `/api/`.
- Nginx rate-limits `/api/` (10 r/s per IP, burst 20, returns 429) and sets `nosniff`, `X-Frame-Options: DENY` and `Referrer-Policy`. Next.js sets the same headers plus `Permissions-Policy`.
- Outbound calls have timeouts: frontend `fetch` uses `AbortSignal.timeout(10s)` and retries at most once; PostgreSQL has connect and statement timeouts; Nginx has proxy timeouts.

## Errors and logging

- Unhandled exceptions return a generic `internal_error`. Stack traces go only to structured JSON logs.
- Every request is logged with a request id (`x-request-id`), method, path, status and duration. Request bodies are not logged.

## Containers

- Images run as non-root users. The production backend runs with a read-only root filesystem.
- PostgreSQL isn't published to the host. In dev, ports bind to `127.0.0.1`.

## Dependencies

- Lockfiles: `frontend/package-lock.json`, `backend/requirements*.txt`.
- CI runs `npm audit` and `pip-audit`. Dependabot proposes weekly updates.
- Check the license of any new dependency before adding it (see `THIRD_PARTY_NOTICES.md`). Avoid GPL-family licenses for linked code.

## Authentication

There is none, because no feature requires it. `user_preferences` is keyed by an anonymous client id. Add authentication only if a feature needs it.
