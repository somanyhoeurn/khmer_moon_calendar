from __future__ import annotations

import os
from datetime import date
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.repositories import HolidayRepository, LunarDateRecordRepository
from app.db.seed import seed_all
from app.models import CalendarSource, Holiday
from app.models.enums import HolidayCategory, HolidayType, SourceType, VerificationStatus

BACKEND = Path(__file__).resolve().parents[2]


def test_migrations_upgrade_and_downgrade(tmp_path: Path) -> None:
    url = os.environ.get("TEST_DATABASE_URL") or f"sqlite+pysqlite:///{tmp_path / 'migrate.db'}"
    cfg = Config(str(BACKEND / "alembic.ini"))
    cfg.set_main_option("sqlalchemy.url", url)
    command.upgrade(cfg, "head")
    tables = set(inspect(create_engine(url)).get_table_names())
    assert {"holidays", "calendar_events", "lunar_date_records", "calendar_sources"} <= tables
    command.downgrade(cfg, "base")
    assert "holidays" not in set(inspect(create_engine(url)).get_table_names())


def test_seed_is_idempotent(session: Session) -> None:
    first = seed_all(session, get_settings().seed_data_dir)
    second = seed_all(session, get_settings().seed_data_dir)
    assert first == second
    assert session.query(Holiday).count() == first["holidays"]


def test_holiday_range_query(seeded_session: Session) -> None:
    repo = HolidayRepository(seeded_session)
    rows = repo.in_range(date(2026, 10, 12), date(2026, 10, 12))
    assert [r.slug for r in rows] == ["pchum-ben-2026"]


def test_reference_records_lookup(seeded_session: Session) -> None:
    refs = LunarDateRecordRepository(seeded_session).in_range(date(2026, 1, 1), date(2026, 12, 31))
    assert date(2026, 11, 24) in refs


def test_date_range_constraint(session: Session) -> None:
    source = CalendarSource(name="t", source_type=SourceType.SECONDARY)
    session.add(source)
    session.flush()
    session.add(
        Holiday(
            slug="bad-range",
            name_km="x",
            name_en="x",
            start_date=date(2026, 1, 2),
            end_date=date(2026, 1, 1),
            category=HolidayCategory.NATIONAL,
            holiday_type=HolidayType.PUBLIC_HOLIDAY,
            is_official_public_holiday=True,
            source_id=source.id,
            verification_status=VerificationStatus.OFFICIAL,
        )
    )
    with pytest.raises(IntegrityError):
        session.flush()
