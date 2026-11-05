# ADR 0005 – Redis response cache

**Status:** accepted (supersedes [ADR 0003](0003-no-redis.md))

Calendar data does not change between deploys, so API responses are cached in Redis (`backend/app/core/cache.py`). Endpoints call `ResponseCache.get_or_set(key, type, compute)`, which reads the JSON from Redis or computes it, validates it through the response schema, and stores it.

- **Cached:** `/calendar/month`, `/calendar/year`, `/lunar-dates/convert`, `/lunar-dates/reverse`, `/holidays`, `/holidays/{slug}`, `/events`. Month and year keys include today's date in Asia/Phnom_Penh, because each day has an `is_today` field.
- **Not cached:** `/calendar/today` and `/health`, which depend on the current time and live state, and `/search`, whose free-text keys would grow without limit.
- **Invalidation:** keys are prefixed `kmc:<app version>:<engine name>@<engine version>`, so a release that bumps either version starts with an empty cache. Entries expire after `CACHE_TTL_SECONDS` (30 days by default; `0` means no expiry). After reseeding holidays without a version bump, run `redis-cli --scan --pattern 'kmc:*' | xargs redis-cli del`.
- **Failure mode:** fail open. `REDIS_URL` unset disables the cache, which keeps local runs and tests zero-config. Each Redis call has a `REDIS_TIMEOUT_SECONDS` socket timeout (0.5 s by default) and at most one retry. After a Redis error, the cache is bypassed for 30 s so an outage doesn't add a timeout to every request.
- **Redis config:** use `maxmemory` with `maxmemory-policy allkeys-lru`, so Redis evicts old entries rather than rejecting writes.

redis-py is MIT licensed.
