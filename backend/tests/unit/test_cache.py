from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient
from redis.exceptions import ConnectionError as RedisConnectionError

from app.core.cache import ResponseCache, get_cache
from app.schemas import HolidayOut


class FakeRedis:
    def __init__(self) -> None:
        self.store: dict[str, bytes] = {}
        self.ttls: dict[str, int | None] = {}
        self.calls = 0

    def get(self, name: str) -> bytes | None:
        self.calls += 1
        return self.store.get(name)

    def set(self, name: str, value: bytes, ex: int | None = None) -> Any:
        self.calls += 1
        self.store[name] = value
        self.ttls[name] = ex
        return True


class DownRedis:
    def __init__(self) -> None:
        self.calls = 0

    def get(self, name: str) -> bytes | None:
        self.calls += 1
        raise RedisConnectionError("connection refused")

    def set(self, name: str, value: bytes, ex: int | None = None) -> Any:
        self.calls += 1
        raise RedisConnectionError("connection refused")


def test_computes_once_then_reads_from_cache() -> None:
    fake = FakeRedis()
    cache = ResponseCache(fake, "ns", ttl_seconds=60)
    computed: list[int] = []

    def compute() -> list[int]:
        computed.append(1)
        return [1, 2, 3]

    assert cache.get_or_set("k", list[int], compute) == [1, 2, 3]
    assert cache.get_or_set("k", list[int], compute) == [1, 2, 3]
    assert len(computed) == 1
    assert fake.store == {"ns:k": b"[1,2,3]"}
    assert fake.ttls == {"ns:k": 60}


def test_zero_ttl_means_no_expiry() -> None:
    fake = FakeRedis()
    ResponseCache(fake, "ns", ttl_seconds=0).get_or_set("k", int, lambda: 1)
    assert fake.ttls == {"ns:k": None}


def test_errors_are_not_cached() -> None:
    fake = FakeRedis()
    cache = ResponseCache(fake, "ns", ttl_seconds=60)

    def fail() -> int:
        raise ValueError("boom")

    with pytest.raises(ValueError):
        cache.get_or_set("k", int, fail)
    assert fake.store == {}


def test_disabled_without_client() -> None:
    cache = ResponseCache(None, "ns", ttl_seconds=60)
    assert not cache.available
    assert cache.get_or_set("k", int, lambda: 7) == 7


def test_redis_outage_fails_open_and_backs_off() -> None:
    down = DownRedis()
    cache = ResponseCache(down, "ns", ttl_seconds=60, cooldown_seconds=60)
    assert cache.get_or_set("k", int, lambda: 1) == 1
    assert cache.get_or_set("k", int, lambda: 2) == 2
    assert down.calls == 1  # second request skipped Redis during the cooldown


def test_holiday_endpoint_is_served_from_cache(client: TestClient) -> None:
    fake = FakeRedis()
    client.app.dependency_overrides[get_cache] = lambda: ResponseCache(fake, "test", ttl_seconds=60)  # type: ignore[attr-defined]

    first = client.get("/api/v1/holidays", params={"year": 2026})
    assert first.status_code == 200
    assert "test:holidays:2026:all" in fake.store

    # Replace the stored value to prove the second response comes from Redis.
    only_first = HolidayOut.model_validate(first.json()[0])
    fake.store["test:holidays:2026:all"] = f"[{only_first.model_dump_json()}]".encode()
    second = client.get("/api/v1/holidays", params={"year": 2026})
    assert second.json() == first.json()[:1]
