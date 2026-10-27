"""ORM models. Importing this package registers every table on ``Base.metadata``."""

from __future__ import annotations

from datetime import date, datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import (
    JSON,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import (
    EventType,
    HolidayCategory,
    HolidayType,
    LunarPhase,
    SourceType,
    VerificationStatus,
)


def _enum(enum: type[StrEnum], name: str) -> Enum:
    return Enum(
        enum,
        name=name,
        native_enum=False,
        create_constraint=True,
        length=32,
        values_callable=lambda e: [member.value for member in e],
        validate_strings=True,
    )


class CalendarSource(Base):
    __tablename__ = "calendar_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    source_url: Mapped[str | None] = mapped_column(String(1024))
    source_type: Mapped[SourceType] = mapped_column(_enum(SourceType, "source_type"))
    publication_year: Mapped[int | None] = mapped_column(SmallInteger)
    description: Mapped[str | None] = mapped_column(Text)
    verification_notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Holiday(TimestampMixin, Base):
    """An official or informational holiday occurrence for a specific year."""

    __tablename__ = "holidays"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="date_range"),
        Index("ix_holidays_start_end", "start_date", "end_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), nullable=False, unique=True)
    name_km: Mapped[str] = mapped_column(String(255), nullable=False)
    name_en: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description_km: Mapped[str | None] = mapped_column(Text)
    description_en: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    category: Mapped[HolidayCategory] = mapped_column(_enum(HolidayCategory, "holiday_category"), index=True)
    holiday_type: Mapped[HolidayType] = mapped_column(_enum(HolidayType, "holiday_type"))
    is_official_public_holiday: Mapped[bool] = mapped_column(nullable=False, default=False)
    lunar_rule: Mapped[str | None] = mapped_column(String(64))  # e.g. "visak-bochea"
    source_id: Mapped[int | None] = mapped_column(
        ForeignKey("calendar_sources.id", ondelete="RESTRICT"), index=True
    )
    verification_status: Mapped[VerificationStatus] = mapped_column(
        _enum(VerificationStatus, "verification_status")
    )

    source: Mapped[CalendarSource | None] = relationship(lazy="joined")


class CalendarEvent(TimestampMixin, Base):
    """A cultural or religious event that is not an official public holiday."""

    __tablename__ = "calendar_events"
    __table_args__ = (
        CheckConstraint("end_date IS NULL OR end_date >= start_date", name="date_range"),
        Index("ix_calendar_events_start_end", "start_date", "end_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), nullable=False, unique=True)
    title_km: Mapped[str] = mapped_column(String(255), nullable=False)
    title_en: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description_km: Mapped[str | None] = mapped_column(Text)
    description_en: Mapped[str | None] = mapped_column(Text)
    event_type: Mapped[EventType] = mapped_column(_enum(EventType, "event_type"), index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date)
    source_id: Mapped[int | None] = mapped_column(
        ForeignKey("calendar_sources.id", ondelete="RESTRICT"), index=True
    )
    verification_status: Mapped[VerificationStatus] = mapped_column(
        _enum(VerificationStatus, "verification_status")
    )

    source: Mapped[CalendarSource | None] = relationship(lazy="joined")


class LunarDateRecord(Base):
    """A lunar date published by a source, used to verify or override calculations."""

    __tablename__ = "lunar_date_records"
    __table_args__ = (
        UniqueConstraint("gregorian_date", "source_id", name="uq_lunar_date_records_date_source"),
        CheckConstraint("lunar_day BETWEEN 1 AND 15", name="lunar_day_range"),
        CheckConstraint("lunar_month BETWEEN 0 AND 13", name="lunar_month_range"),
        Index("ix_lunar_date_records_lookup", "lunar_year", "lunar_month", "lunar_day", "lunar_phase"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    gregorian_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    lunar_year: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # BE year
    lunar_month: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # LunarMonth value
    lunar_day: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    lunar_phase: Mapped[LunarPhase] = mapped_column(_enum(LunarPhase, "lunar_phase"))
    formatted_date_km: Mapped[str | None] = mapped_column(String(255))
    formatted_date_en: Mapped[str | None] = mapped_column(String(255))
    verification_status: Mapped[VerificationStatus] = mapped_column(
        _enum(VerificationStatus, "verification_status")
    )
    source_id: Mapped[int] = mapped_column(
        ForeignKey("calendar_sources.id", ondelete="RESTRICT"), nullable=False
    )
    calculation_version: Mapped[str | None] = mapped_column(String(64))
    notes: Mapped[str | None] = mapped_column(Text)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    source: Mapped[CalendarSource] = relationship(lazy="joined")


class UserPreference(TimestampMixin, Base):
    """Optional, anonymous preferences keyed by a client-generated id (no auth)."""

    __tablename__ = "user_preferences"
    __table_args__ = (
        CheckConstraint("locale IN ('km', 'en')", name="locale"),
        CheckConstraint("preferred_numeral_system IN ('khmer', 'latin')", name="numerals"),
        CheckConstraint("preferred_calendar_view IN ('month', 'year')", name="view"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    locale: Mapped[str] = mapped_column(String(8), nullable=False, default="km")
    preferred_numeral_system: Mapped[str] = mapped_column(String(16), default="khmer")
    preferred_calendar_view: Mapped[str] = mapped_column(String(16), default="month")
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Phnom_Penh")
    notification_preferences: Mapped[dict[str, Any] | None] = mapped_column(JSON)


__all__ = [
    "CalendarEvent",
    "CalendarSource",
    "Holiday",
    "LunarDateRecord",
    "UserPreference",
]
