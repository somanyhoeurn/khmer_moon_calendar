"""Data-access layer. Repositories return ORM objects and never contain business rules."""

from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models import CalendarEvent, CalendarSource, Holiday, LunarDateRecord


def _overlapping[S: Select[Any]](
    stmt: S, model: type[Holiday] | type[CalendarEvent], start: date, end: date
) -> S:
    end_col = func.coalesce(model.end_date, model.start_date)
    return stmt.where(model.start_date <= end, end_col >= start)


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class HolidayRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def in_range(self, start: date, end: date, category: str | None = None) -> list[Holiday]:
        stmt = _overlapping(select(Holiday), Holiday, start, end)
        if category:
            stmt = stmt.where(Holiday.category == category)
        return list(self.session.scalars(stmt.order_by(Holiday.start_date, Holiday.id)))

    def by_slug(self, slug: str) -> Holiday | None:
        return self.session.scalar(select(Holiday).where(Holiday.slug == slug))

    def search(self, term: str, limit: int, offset: int) -> tuple[list[Holiday], int]:
        pattern = f"%{_escape_like(term)}%"
        cond = or_(
            Holiday.name_en.ilike(pattern, escape="\\"),
            Holiday.name_km.ilike(pattern, escape="\\"),
            Holiday.slug.ilike(pattern, escape="\\"),
        )
        total = self.session.scalar(select(func.count()).select_from(Holiday).where(cond)) or 0
        rows = self.session.scalars(
            select(Holiday).where(cond).order_by(Holiday.start_date.desc()).limit(limit).offset(offset)
        )
        return list(rows), total


class CalendarEventRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def in_range(self, start: date, end: date) -> list[CalendarEvent]:
        stmt = _overlapping(select(CalendarEvent), CalendarEvent, start, end)
        return list(self.session.scalars(stmt.order_by(CalendarEvent.start_date, CalendarEvent.id)))

    def search(self, term: str, limit: int, offset: int) -> tuple[list[CalendarEvent], int]:
        pattern = f"%{_escape_like(term)}%"
        cond = or_(
            CalendarEvent.title_en.ilike(pattern, escape="\\"),
            CalendarEvent.title_km.ilike(pattern, escape="\\"),
        )
        total = self.session.scalar(select(func.count()).select_from(CalendarEvent).where(cond)) or 0
        rows = self.session.scalars(
            select(CalendarEvent)
            .where(cond)
            .order_by(CalendarEvent.start_date.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(rows), total


class LunarDateRecordRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def in_range(self, start: date, end: date) -> dict[date, LunarDateRecord]:
        """Best reference per date (official before secondary sources)."""
        rows = self.session.scalars(
            select(LunarDateRecord)
            .where(LunarDateRecord.gregorian_date.between(start, end))
            .order_by(LunarDateRecord.gregorian_date, LunarDateRecord.id)
        )
        best: dict[date, LunarDateRecord] = {}
        rank = {"official": 0, "secondary_source": 1}
        for row in rows:
            current = best.get(row.gregorian_date)
            if rank.get(row.verification_status, 9) < 9 and (
                current is None
                or rank.get(row.verification_status, 9) < rank.get(current.verification_status, 9)
            ):
                best[row.gregorian_date] = row
        return best


class CalendarSourceRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def by_name(self, name: str) -> CalendarSource | None:
        return self.session.scalar(select(CalendarSource).where(CalendarSource.name == name))
