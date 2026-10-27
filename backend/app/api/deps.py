"""Dependency wiring: builds services per request from a DB session."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.repositories import (
    CalendarEventRepository,
    HolidayRepository,
    LunarDateRecordRepository,
)
from app.db.session import get_db
from app.domain.calendar.engine import ChhankitekEngine, get_engine
from app.services.calendar_service import CalendarService
from app.services.conversion_service import ConversionService
from app.services.holiday_service import HolidayService
from app.services.lunar_date_service import LunarDateService

DbSession = Annotated[Session, Depends(get_db)]
AppSettings = Annotated[Settings, Depends(get_settings)]
Engine = Annotated[ChhankitekEngine, Depends(get_engine)]


def get_lunar_date_service(db: DbSession, engine: Engine) -> LunarDateService:
    return LunarDateService(engine, LunarDateRecordRepository(db))


def get_holiday_service(db: DbSession, engine: Engine) -> HolidayService:
    return HolidayService(engine, HolidayRepository(db), CalendarEventRepository(db))


def get_now(settings: AppSettings) -> datetime:
    """Current moment in Cambodia. Overridden in tests."""
    return datetime.now(settings.tz)


def get_calendar_service(
    lunar: Annotated[LunarDateService, Depends(get_lunar_date_service)],
    holidays: Annotated[HolidayService, Depends(get_holiday_service)],
    now: Annotated[datetime, Depends(get_now)],
    settings: AppSettings,
) -> CalendarService:
    return CalendarService(lunar, holidays, now=lambda: now, timezone_name=settings.timezone)


def get_conversion_service(
    engine: Engine, lunar: Annotated[LunarDateService, Depends(get_lunar_date_service)]
) -> ConversionService:
    return ConversionService(engine, lunar)


LunarDates = Annotated[LunarDateService, Depends(get_lunar_date_service)]
Holidays = Annotated[HolidayService, Depends(get_holiday_service)]
Calendar = Annotated[CalendarService, Depends(get_calendar_service)]
Conversion = Annotated[ConversionService, Depends(get_conversion_service)]
