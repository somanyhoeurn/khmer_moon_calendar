"""Lunar dates enriched with verification metadata, ready for the API."""

from __future__ import annotations

from datetime import date, timedelta

from app.db.repositories import LunarDateRecordRepository
from app.domain.calendar.constants import (
    ANIMAL_YEAR_NAMES_EN,
    ANIMAL_YEAR_NAMES_KM,
    LUNAR_MONTH_NAMES_EN,
    LUNAR_MONTH_NAMES_KM,
    PHASE_NAMES_KM,
    SAK_NAMES_EN,
    SAK_NAMES_KM,
    WEEKDAY_NAMES_EN,
    WEEKDAY_NAMES_KM,
    LunarMonth,
    MoonPhase,
)
from app.domain.calendar.engine import ChhankitekEngine
from app.domain.calendar.formatting import (
    format_lunar_en,
    format_lunar_km,
    format_lunar_short_en,
    format_lunar_short_km,
)
from app.domain.calendar.validation import (
    CalendarValidationService,
    ReferenceLunarDate,
    ValidatedLunarDate,
)
from app.models import LunarDateRecord
from app.schemas import LocalizedName, LunarDateOut, LunarMonthOut, SourceOut, VerificationOut


def _to_reference(record: LunarDateRecord) -> ReferenceLunarDate:
    return ReferenceLunarDate(
        gregorian_date=record.gregorian_date,
        month=LunarMonth(record.lunar_month),
        day=record.lunar_day,
        phase=MoonPhase(record.lunar_phase),
        source_name=record.source.name,
        source_url=record.source.source_url,
        verification_status=str(record.verification_status),
    )


class LunarDateService:
    def __init__(
        self,
        engine: ChhankitekEngine,
        records: LunarDateRecordRepository,
        validator: CalendarValidationService | None = None,
    ) -> None:
        self.engine = engine
        self.records = records
        self.validator = validator or CalendarValidationService()

    def get(self, value: date) -> LunarDateOut:
        return self.get_range(value, value)[0]

    def get_range(self, start: date, end: date) -> list[LunarDateOut]:
        references = self.records.in_range(start, end)
        out: list[LunarDateOut] = []
        current = start
        while current <= end:
            lunar = self.engine.to_lunar(current)
            record = references.get(current)
            validated = self.validator.validate(lunar, _to_reference(record) if record else None)
            out.append(self.serialize(validated, record))
            current += timedelta(days=1)
        return out

    def serialize(self, validated: ValidatedLunarDate, record: LunarDateRecord | None = None) -> LunarDateOut:
        lunar = validated.lunar
        weekday = lunar.gregorian_date.weekday()
        source = (
            SourceOut(
                name=record.source.name,
                source_url=record.source.source_url,
                source_type=str(record.source.source_type),
                publication_year=record.source.publication_year,
            )
            if record
            else None
        )
        return LunarDateOut(
            gregorian_date=lunar.gregorian_date,
            weekday=LocalizedName(
                index=weekday, name_km=WEEKDAY_NAMES_KM[weekday], name_en=WEEKDAY_NAMES_EN[weekday]
            ),
            lunar_day=lunar.day,
            phase=lunar.phase,
            phase_km=PHASE_NAMES_KM[lunar.phase],
            day_of_month=lunar.day_of_month,
            days_in_month=lunar.days_in_month,
            month=LunarMonthOut(
                id=lunar.month.slug,
                index=int(lunar.month),
                name_km=LUNAR_MONTH_NAMES_KM[lunar.month],
                name_en=LUNAR_MONTH_NAMES_EN[lunar.month],
                is_leap_month=lunar.month in (LunarMonth.PATHAMASADH, LunarMonth.TUTIYASADH),
            ),
            be_year=lunar.be_year,
            js_year=lunar.js_year,
            animal_year=LocalizedName(
                index=lunar.animal_year,
                name_km=ANIMAL_YEAR_NAMES_KM[lunar.animal_year],
                name_en=ANIMAL_YEAR_NAMES_EN[lunar.animal_year],
            ),
            sak=LocalizedName(
                index=lunar.sak, name_km=SAK_NAMES_KM[lunar.sak], name_en=SAK_NAMES_EN[lunar.sak]
            ),
            year_has_leap_month=lunar.year_has_leap_month,
            year_has_leap_day=lunar.year_has_leap_day,
            is_full_moon=lunar.is_full_moon,
            is_new_moon=lunar.is_new_moon,
            is_sila_day=lunar.is_sila_day,
            is_shaving_day=lunar.is_shaving_day,
            formatted_km=format_lunar_km(lunar),
            formatted_en=format_lunar_en(lunar),
            short_km=format_lunar_short_km(lunar),
            short_en=format_lunar_short_en(lunar),
            verification=VerificationOut(
                status=validated.verification.value,
                engine=self.engine.name,
                engine_version=self.engine.version,
                reference_source=source,
                reference_status=str(record.verification_status) if record else None,
                calculated_lunar_date_en=(
                    format_lunar_short_en(validated.calculated) if validated.calculated else None
                ),
            ),
        )
