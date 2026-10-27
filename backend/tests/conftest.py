from __future__ import annotations

import json
import os
from collections.abc import Iterator
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.api.deps import get_now
from app.core.config import get_settings
from app.db.base import Base
from app.db.seed import seed_all
from app.db.session import get_db
from app.main import create_app

FIXTURES = Path(__file__).parent / "fixtures"
PHNOM_PENH = ZoneInfo("Asia/Phnom_Penh")
FIXED_NOW = datetime(2026, 10, 27, 9, 30, tzinfo=PHNOM_PENH)


@pytest.fixture(scope="session")
def reference_dates() -> list[dict[str, object]]:
    data = json.loads((FIXTURES / "reference_lunar_dates.json").read_text(encoding="utf-8"))
    return list(data["dates"])


@pytest.fixture
def db_engine() -> Iterator[Engine]:
    url = os.environ.get("TEST_DATABASE_URL", "sqlite+pysqlite:///:memory:")
    kwargs: dict[str, object] = {}
    if url.startswith("sqlite"):
        kwargs = {"connect_args": {"check_same_thread": False}, "poolclass": StaticPool}
    engine = create_engine(url, **kwargs)  # type: ignore[arg-type]
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def session(db_engine: Engine) -> Iterator[Session]:
    factory = sessionmaker(bind=db_engine, expire_on_commit=False)
    with factory() as s:
        yield s


@pytest.fixture
def seeded_session(session: Session) -> Session:
    seed_all(session, get_settings().seed_data_dir)
    return session


@pytest.fixture
def client(seeded_session: Session) -> Iterator[TestClient]:
    application = create_app()
    application.dependency_overrides[get_db] = lambda: seeded_session
    application.dependency_overrides[get_now] = lambda: FIXED_NOW
    with TestClient(application) as c:
        yield c
