# Production deployment

`infra/deployment/docker-compose.prod.yml` runs:

```
Internet ──► nginx:80 ──► frontend:3000 (Next.js standalone, non-root)
                    └──► backend:8087  (FastAPI, 2 workers, non-root, read-only FS)
                              └──► db (PostgreSQL 17, named volume, internal network only)
```

## Steps

```bash
cp .env.example .env
# Set: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD (long random value),
#      CORS_ORIGINS=https://your-domain, NEXT_PUBLIC_SITE_URL=https://your-domain,
#      ENVIRONMENT=production, LOG_FORMAT=json
make prod-up          # build images, start db/backend/frontend/nginx
make prod-migrate     # one-off: alembic upgrade head + verified seed data
```

Images can also be built on their own (CI does this in `.github/workflows/docker-build.yml`):

```bash
docker build -f infra/docker/backend.Dockerfile  -t kmc-backend  .
docker build -f infra/docker/frontend.Dockerfile -t kmc-frontend --build-arg NEXT_PUBLIC_SITE_URL=https://your-domain .
```

## TLS

Terminate TLS at a load balancer, or add a `listen 443 ssl` server block to `infra/nginx/nginx.conf` with certificates mounted read-only. Keep certificate files out of the repository.

## Operations

- **Health:** `GET /api/v1/health` (503 if the database is down). Both images define Docker `HEALTHCHECK`s.
- **Logs:** JSON to stdout from the backend and Nginx; ship them with your log collector (see `infra/monitoring/README.md`).
- **Backups:** `docker compose -f infra/deployment/docker-compose.prod.yml exec db pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql`
- **Upgrades:** pull, `make prod-up`, then `make prod-migrate`. Migrations must stay backward compatible for one release.
- **Holiday data updates:** follow [Updating official holiday data](../calendar/khmer-lunar-calendar.md#updating-official-holiday-data), then run `make prod-migrate`, which re-runs the idempotent seed.
