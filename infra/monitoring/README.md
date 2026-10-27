# Monitoring

There is no monitoring stack bundled yet. The application exposes what one needs:

- **Liveness and readiness:** `GET /api/v1/health` returns 200 `{"status":"ok","database":"ok"}`, or 503 when PostgreSQL is unreachable. Both production images declare Docker `HEALTHCHECK`s, and Compose waits on them.
- **Logs:** the backend writes JSON lines to stdout (`timestamp`, `level`, `logger`, `message`, `request_id`, `method`, `path`, `status`, `duration_ms`). Nginx writes JSON access logs with `request_id`, which is forwarded to the backend as `X-Request-ID` for correlation.
- **Suggested alerts:** health check failing for 2 minutes or more; 5xx rate above 1%; p95 `duration_ms` above 1 s on `/api/v1/calendar/*`; 429 spikes (possible abuse).

Any collector that reads container stdout works (Loki, CloudWatch, Datadog).
