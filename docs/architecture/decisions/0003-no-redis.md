# ADR 0003 – Single FastAPI service with PostgreSQL; no Redis yet

**Status:** accepted

The engine computes a full year in about 0.1 s cold and is memoized in-process (`functools.lru_cache`). Holiday queries are small, indexed range queries. Redis would add operational cost without a measured need, so it is omitted. If profiling shows a need, add HTTP caching at Nginx first, then Redis in front of `CalendarService.year`.
