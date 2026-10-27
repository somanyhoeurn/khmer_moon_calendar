from __future__ import annotations

import pytest

from app.core.config import Settings


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("http://localhost:3000", ["http://localhost:3000"]),
        ("https://a.example, https://b.example", ["https://a.example", "https://b.example"]),
        ('["https://a.example"]', ["https://a.example"]),
    ],
)
def test_cors_origins_from_env(monkeypatch: pytest.MonkeyPatch, raw: str, expected: list[str]) -> None:
    monkeypatch.setenv("CORS_ORIGINS", raw)
    assert Settings().cors_origins == expected


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        # Neon / Render style URLs are switched to the installed psycopg 3 driver (placeholder credentials).
        (
            "postgresql://user:secret@ep-x.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
            "postgresql+psycopg://user:secret@ep-x.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
        ),
        ("postgres://user:secret@host/db", "postgresql+psycopg://user:secret@host/db"),
        ("postgresql+psycopg://user:secret@host/db", "postgresql+psycopg://user:secret@host/db"),
        ("sqlite+pysqlite:///./x.db", "sqlite+pysqlite:///./x.db"),
    ],
)
def test_database_url_uses_psycopg(monkeypatch: pytest.MonkeyPatch, raw: str, expected: str) -> None:
    monkeypatch.setenv("DATABASE_URL", raw)
    assert Settings().database_url == expected


def test_pooler_urls_skip_the_startup_options_parameter(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.db import session

    captured: dict[str, dict[str, object]] = {}
    monkeypatch.setattr(
        session, "create_engine", lambda url, **kw: captured.setdefault(url, kw["connect_args"])
    )
    session.build_engine("postgresql+psycopg://user:secret@ep-x-pooler.aws.neon.tech/neondb")
    session.build_engine("postgresql+psycopg://user:secret@ep-x.aws.neon.tech/neondb")
    assert "options" not in captured["postgresql+psycopg://user:secret@ep-x-pooler.aws.neon.tech/neondb"]
    assert "statement_timeout" in str(
        captured["postgresql+psycopg://user:secret@ep-x.aws.neon.tech/neondb"]["options"]
    )
