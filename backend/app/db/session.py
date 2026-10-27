"""Engine and session factory."""

from __future__ import annotations

from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def build_engine(url: str) -> Engine:
    settings = get_settings()
    if url.startswith("sqlite"):
        return create_engine(url, echo=settings.database_echo, connect_args={"check_same_thread": False})
    connect_args: dict[str, object] = {"connect_timeout": settings.database_pool_timeout_seconds}
    # PgBouncer-style poolers (e.g. Neon's "-pooler" endpoints) reject the "options" startup
    # parameter; there the statement timeout must be set on the database role instead.
    if "-pooler." not in url:
        connect_args["options"] = f"-c statement_timeout={settings.database_statement_timeout_ms}"
    return create_engine(
        url,
        echo=settings.database_echo,
        pool_pre_ping=True,
        pool_timeout=settings.database_pool_timeout_seconds,
        connect_args=connect_args,
    )


@lru_cache
def get_engine() -> Engine:
    return build_engine(get_settings().database_url)


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """FastAPI dependency yielding a request-scoped session."""
    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()


def check_database(session: Session) -> bool:
    try:
        session.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
