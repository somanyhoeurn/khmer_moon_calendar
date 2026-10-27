"""Gregorian ⇄ Khmer lunar conversion use cases."""

from __future__ import annotations

from datetime import date

from app.core.exceptions import InvalidLunarDateError
from app.domain.calendar.constants import LunarMonth, MoonPhase
from app.domain.calendar.engine import ChhankitekEngine
from app.domain.calendar.types import LunarDateQuery
from app.schemas import LunarDateOut, ReverseConversionOut
from app.services.lunar_date_service import LunarDateService

_LEAP_ONLY = (LunarMonth.PATHAMASADH, LunarMonth.TUTIYASADH)


class ConversionService:
    def __init__(self, engine: ChhankitekEngine, lunar_dates: LunarDateService) -> None:
        self.engine = engine
        self.lunar_dates = lunar_dates

    def to_lunar(self, value: date) -> LunarDateOut:
        return self.lunar_dates.get(value)

    def to_gregorian(self, be_year: int, month_id: str, day: int, phase: MoonPhase) -> ReverseConversionOut:
        month = LunarMonth.from_slug(month_id)
        query = LunarDateQuery(be_year=be_year, month=month, day=day, phase=phase)
        echo = {"be_year": be_year, "month": month_id, "day": day, "phase": phase.value}

        matches = self.engine.to_gregorian(query)
        if not matches:
            # The Asadh season of BE year N falls in AD N - 544.
            leap = self.engine.has_leap_month(be_year)
            if month == LunarMonth.ASADH and leap:
                raise InvalidLunarDateError(
                    f"BE {be_year} has a leap month: use 'pathamasadh' or 'tutiyasadh' instead of 'asadh'.",
                    details={"query": echo, "suggested_months": ["pathamasadh", "tutiyasadh"]},
                )
            if month in _LEAP_ONLY and not leap:
                raise InvalidLunarDateError(
                    f"BE {be_year} has no leap month, so '{month_id}' does not exist; use 'asadh'.",
                    details={"query": echo, "suggested_months": ["asadh"]},
                )
            raise InvalidLunarDateError(
                "No Gregorian date matches this lunar date. Waning day 15 exists only in 30-day months.",
                details={"query": echo},
            )

        candidates = [self.lunar_dates.get(found) for found in matches]
        return ReverseConversionOut(query=echo, candidates=candidates, ambiguous=len(candidates) > 1)
