"""Redis read-through cache for API responses.

Calendar data is immutable for a given app and engine version, so responses are cached
until their TTL expires. Keys are namespaced by both versions, so a deploy that changes
either starts from an empty cache. The cache fails open: when Redis is missing or down,
responses are computed as usual.
"""

from __future__ import annotations

import logging
import time
from collections.abc import Callable
from functools import lru_cache
from typing import Any, Protocol, TypeVar

from pydantic import TypeAdapter
from redis import Redis
from redis.backoff import NoBackoff
from redis.exceptions import RedisError
from redis.retry import Retry

from app import __version__
from app.core.config import get_settings
from app.domain.calendar.engine import get_engine

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CacheClient(Protocol):
    def get(self, name: str) -> Any: ...

    def set(self, name: str, value: bytes, ex: int | None = None) -> Any: ...


@lru_cache(maxsize=64)
def _adapter(type_: Any) -> TypeAdapter[Any]:
    return TypeAdapter(type_)


class ResponseCache:
    def __init__(
        self,
        client: CacheClient | None,
        namespace: str,
        ttl_seconds: int,
        cooldown_seconds: float = 30.0,
    ) -> None:
        self.client = client
        self.namespace = namespace
        self.ttl_seconds = ttl_seconds
        self.cooldown_seconds = cooldown_seconds
        self._down_until = 0.0

    @property
    def available(self) -> bool:
        return self.client is not None and time.monotonic() >= self._down_until

    def _failed(self, exc: RedisError) -> None:
        # Skip Redis for a while so an outage doesn't add a timeout to every request.
        self._down_until = time.monotonic() + self.cooldown_seconds
        logger.warning("Redis unavailable, bypassing cache", extra={"error": str(exc)})

    def get_or_set(self, key: str, type_: Any, compute: Callable[[], T]) -> T:
        client = self.client
        if client is None or not self.available:
            return compute()
        adapter = _adapter(type_)
        full_key = f"{self.namespace}:{key}"
        try:
            raw = client.get(full_key)
        except RedisError as exc:
            self._failed(exc)
            return compute()
        if raw is not None:
            return adapter.validate_json(raw)  # type: ignore[no-any-return]

        value = compute()
        try:
            client.set(full_key, adapter.dump_json(value), ex=self.ttl_seconds or None)
        except RedisError as exc:
            self._failed(exc)
        return value


def build_redis(url: str, timeout_seconds: float) -> Redis:
    return Redis.from_url(
        url,
        socket_timeout=timeout_seconds,
        socket_connect_timeout=timeout_seconds,
        retry=Retry(NoBackoff(), retries=1),
        health_check_interval=30,
    )


@lru_cache
def get_cache() -> ResponseCache:
    settings = get_settings()
    engine = get_engine()
    client = build_redis(settings.redis_url, settings.redis_timeout_seconds) if settings.redis_url else None
    namespace = f"kmc:{__version__}:{engine.name}@{engine.version}"
    return ResponseCache(client, namespace, settings.cache_ttl_seconds)
