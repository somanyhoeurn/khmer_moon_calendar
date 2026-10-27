"""Pydantic request/response schemas for API v1."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.domain.calendar.constants import LunarMonth, MoonPhase

LunarMonthId = Literal[
    "migasir", "boss", "meak", "phalkun", "cheit", "pisakh", "jesth", "asadh",
    "srap", "phatrabot", "assoch", "kadeuk", "pathamasadh", "tutiyasadh",
]  # fmt: skip

LUNAR_MONTH_IDS: tuple[str, ...] = tuple(m.slug for m in LunarMonth)


class Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Shared
# ---------------------------------------------------------------------------


class ErrorBody(Schema):
    code: str = Field(examples=["validation_error"])
    message: str
    details: object | None = None


class ErrorResponse(Schema):
    error: ErrorBody


class LocalizedName(Schema):
    index: int
    name_km: str
    name_en: str


class SourceOut(Schema):
    name: str
    source_url: str | None = None
    source_type: str
    publication_year: int | None = None


class VerificationOut(Schema):
    status: Literal["calculated", "verified", "overridden"] = Field(
        description="`calculated` results are algorithmic and not officially confirmed."
    )
    engine: str
    engine_version: str
    reference_source: SourceOut | None = None
    reference_status: str | None = Field(
        default=None, description="Verification status of the reference record, if any."
    )
    calculated_lunar_date_en: str | None = Field(
        default=None, description="Engine output when a reference record overrode it."
    )


# ---------------------------------------------------------------------------
# Lunar dates
# ---------------------------------------------------------------------------


class LunarMonthOut(Schema):
    id: LunarMonthId
    index: int
    name_km: str
    name_en: str
    is_leap_month: bool = Field(description="True for Pathamasadh / Tutiyasadh.")


class LunarDateOut(Schema):
    gregorian_date: date
    weekday: LocalizedName
    lunar_day: int = Field(ge=1, le=15)
    phase: MoonPhase
    phase_km: str
    day_of_month: int = Field(ge=1, le=30, description="1..30 counted from ១កើត.")
    days_in_month: int
    month: LunarMonthOut
    be_year: int = Field(description="Buddhist Era; increments on ១រោច ខែពិសាខ.")
    js_year: int
    animal_year: LocalizedName
    sak: LocalizedName
    year_has_leap_month: bool
    year_has_leap_day: bool
    is_full_moon: bool
    is_new_moon: bool
    is_sila_day: bool
    is_shaving_day: bool
    formatted_km: str
    formatted_en: str
    short_km: str
    short_en: str
    verification: VerificationOut


class TodayOut(Schema):
    timezone: str
    now: datetime
    date: LunarDateOut


class ReverseConversionOut(Schema):
    query: dict[str, object]
    candidates: list[LunarDateOut]
    ambiguous: bool = Field(description="True when more than one Gregorian date matches.")


# ---------------------------------------------------------------------------
# Holidays and events
# ---------------------------------------------------------------------------


class HolidayOut(Schema):
    slug: str
    name_km: str
    name_en: str
    description_km: str | None = None
    description_en: str | None = None
    start_date: date
    end_date: date
    category: str
    holiday_type: str
    is_official_public_holiday: bool
    lunar_rule: str | None = None
    verification_status: str
    source: SourceOut | None = None
    updated_at: datetime | None = None


class EventOut(Schema):
    slug: str
    title_km: str
    title_en: str
    description_km: str | None = None
    description_en: str | None = None
    event_type: str
    category: str
    start_date: date
    end_date: date
    anchor_lunar_date_km: str | None = None
    anchor_lunar_date_en: str | None = None
    # A day that is normally a public holiday, derived from a rule (not an official announcement).
    expected_public_holiday: bool = False
    origin: Literal["database", "lunar_rule", "date_rule", "songkran_calculation"]
    verification_status: str
    source: SourceOut | None = None


class Page[T](Schema):
    items: list[T]
    total: int
    limit: int
    offset: int


# ---------------------------------------------------------------------------
# Calendar
# ---------------------------------------------------------------------------


class CalendarDayOut(Schema):
    date: date
    is_today: bool
    is_weekend: bool
    lunar: LunarDateOut
    holidays: list[str] = Field(description="Slugs of holidays covering this day.")
    events: list[str] = Field(description="Slugs of events/observances covering this day.")


class CalendarMonthOut(Schema):
    year: int
    month: int
    days: list[CalendarDayOut]
    holidays: list[HolidayOut]
    events: list[EventOut]


class CalendarYearOut(Schema):
    year: int
    months: list[CalendarMonthOut]


# ---------------------------------------------------------------------------
# Search and health
# ---------------------------------------------------------------------------


class SearchHit(Schema):
    kind: Literal["holiday", "event", "date"]
    slug: str | None = None
    title_km: str
    title_en: str
    start_date: date
    end_date: date | None = None
    verification_status: str


class HealthOut(Schema):
    status: Literal["ok", "degraded"]
    app: str
    version: str
    environment: str
    database: Literal["ok", "unavailable"]
    calendar_engine: str
