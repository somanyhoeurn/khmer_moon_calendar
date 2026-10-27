"""Idempotent loader for sourced seed data.

Only ``<seed dir>/verified`` is loaded by default: every record there cites a
source. Data for demos or tests must live elsewhere (e.g. ``seeds/sample``)
and is loaded only when explicitly requested.
"""

from __future__ import annotations

import json
import logging
from datetime import date
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.calendar.constants import LunarMonth
from app.models import CalendarSource, Holiday, LunarDateRecord
from app.models.enums import HolidayType, VerificationStatus

logger = logging.getLogger(__name__)


def _read(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _source(session: Session, name: str) -> CalendarSource:
    source = session.scalar(select(CalendarSource).where(CalendarSource.name == name))
    if source is None:
        raise ValueError(f"Seed references unknown source: {name!r}")
    return source


def seed_sources(session: Session, path: Path) -> int:
    count = 0
    for item in _read(path):
        existing = session.scalar(select(CalendarSource).where(CalendarSource.name == item["name"]))
        if existing is None:
            session.add(CalendarSource(**item))
        else:
            for key, value in item.items():
                setattr(existing, key, value)
        count += 1
    session.flush()
    return count


def seed_holidays(session: Session, path: Path) -> int:
    data = _read(path)
    source = _source(session, data["source"])
    status = VerificationStatus(data["verification_status"])
    count = 0
    for item in data["holidays"]:
        values = {
            **item,
            "start_date": date.fromisoformat(item["start_date"]),
            "end_date": date.fromisoformat(item["end_date"]),
            "holiday_type": HolidayType.PUBLIC_HOLIDAY,
            "is_official_public_holiday": True,
            "source_id": source.id,
            "verification_status": status,
        }
        existing = session.scalar(select(Holiday).where(Holiday.slug == item["slug"]))
        if existing is None:
            session.add(Holiday(**values))
        else:
            for key, value in values.items():
                setattr(existing, key, value)
        count += 1
    session.flush()
    return count


def seed_lunar_references(session: Session, path: Path) -> int:
    data = _read(path)
    status = VerificationStatus(data["verification_status"])
    count = 0
    for item in data["records"]:
        source = _source(session, item["source"])
        gregorian = date.fromisoformat(item["gregorian_date"])
        values = {
            "gregorian_date": gregorian,
            "lunar_year": item["lunar_year"],
            "lunar_month": int(LunarMonth.from_slug(item["lunar_month"])),
            "lunar_day": item["lunar_day"],
            "lunar_phase": item["lunar_phase"],
            "verification_status": status,
            "source_id": source.id,
            "notes": item.get("notes"),
        }
        existing = session.scalar(
            select(LunarDateRecord).where(
                LunarDateRecord.gregorian_date == gregorian, LunarDateRecord.source_id == source.id
            )
        )
        if existing is None:
            session.add(LunarDateRecord(**values))
        else:
            for key, value in values.items():
                setattr(existing, key, value)
        count += 1
    session.flush()
    return count


def seed_all(session: Session, seed_dir: Path, include_samples: bool = False) -> dict[str, int]:
    verified = seed_dir / "verified"
    result = {"sources": seed_sources(session, verified / "sources.json")}
    holidays = 0
    for path in sorted(verified.glob("holidays-*.json")):
        holidays += seed_holidays(session, path)
    result["holidays"] = holidays
    result["lunar_reference_dates"] = seed_lunar_references(session, verified / "lunar-reference-dates.json")
    if include_samples and (seed_dir / "sample").is_dir():
        logger.warning("Loading SAMPLE seed data; never do this in production")
        for path in sorted((seed_dir / "sample").glob("holidays-*.json")):
            result["sample_holidays"] = result.get("sample_holidays", 0) + seed_holidays(session, path)
    session.commit()
    return result


def main() -> None:
    import argparse

    from app.core.config import get_settings
    from app.db.session import get_session_factory

    parser = argparse.ArgumentParser(description="Load Khmer Moon Calendar seed data")
    parser.add_argument("--seed-dir", type=Path, default=None)
    parser.add_argument("--include-samples", action="store_true")
    args = parser.parse_args()

    seed_dir = args.seed_dir or get_settings().seed_data_dir
    with get_session_factory()() as session:
        print(json.dumps(seed_all(session, seed_dir, args.include_samples)))


if __name__ == "__main__":
    main()
