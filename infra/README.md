# Infrastructure

| Path | Purpose |
| --- | --- |
| `docker/backend.Dockerfile` | Production backend image (multi-stage, non-root, includes verified seeds). Build context: repo root. |
| `docker/frontend.Dockerfile` | Production frontend image (Next.js standalone, non-root). Build context: repo root. |
| `nginx/nginx.conf` | Reverse proxy: `/api` → backend (rate-limited, GET only), everything else → frontend |
| `database/init/` | Runs once on a fresh PostgreSQL volume (sets the timezone to Asia/Phnom_Penh) |
| `database/seeds/verified/` | Sourced seed data: calendar sources, 2026 public holidays, lunar reference dates |
| `deployment/docker-compose.prod.yml` | Production stack (nginx, frontend, backend, db, one-off `migrate`) |
| `monitoring/` | Health-check and logging guidance |

Development images live next to each package (`backend/Dockerfile`, `frontend/Dockerfile`) and are used by the root `docker-compose.yml`.

See [docs/deployment/production.md](../docs/deployment/production.md).
