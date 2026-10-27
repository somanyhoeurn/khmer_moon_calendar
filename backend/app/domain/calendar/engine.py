"""Calendar engine integration boundary.

The rest of the application depends only on the protocols below. The concrete
``ChhankitekEngine`` can be swapped (e.g. for a table published by the Ministry
of Cults and Religion) without touching services, API or frontend.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Protocol

from app.domain.calendar import chhankitek
from app.domain.calendar.constants import LunarMonth, MoonPhase
from app.domain.calendar.types import (
    SUPPORTED_MAX_DATE,
    SUPPORTED_MIN_DATE,
    KhmerLunarDate,
    KhmerNewYear,
    LunarDateQuery,
    UnsupportedDateError,
)


class GregorianToKhmerLunarConverter(Protocol):
    def to_lunar(self, value: date) -> KhmerLunarDate: ...


class KhmerLunarToGregorianConverter(Protocol):
    def to_gregorian(self, query: LunarDateQuery) -> list[date]: ...


class KhmerLunarCalendarEngine(GregorianToKhmerLunarConverter, KhmerLunarToGregorianConverter, Protocol):
    name: str
    version: str
    min_date: date
    max_date: date

    def khmer_new_year(self, year: int) -> KhmerNewYear: ...

    def has_leap_month(self, be_year: int) -> bool: ...


class ChhankitekEngine:
    """Traditional Chhankitek arithmetic (Python port of MomentKH)."""

    name = "chhankitek-momentkh-port"
    version = "1.0.0"
    min_date = SUPPORTED_MIN_DATE
    max_date = SUPPORTED_MAX_DATE

    def _check(self, value: date) -> None:
        if not (self.min_date <= value <= self.max_date):
            raise UnsupportedDateError(
                f"{value.isoformat()} is outside the supported range "
                f"{self.min_date.isoformat()}..{self.max_date.isoformat()}"
            )

    def to_lunar(self, value: date) -> KhmerLunarDate:
        self._check(value)
        raw = chhankitek.gregorian_to_lunar(value)
        # Month length must use the same BE approximation as the day walk.
        walk_be = chhankitek.maybe_be_year(value.year, value.month)
        waxing = raw.day_number < 15
        # Jesth/Asadh always fall in May-August, so the leap flags describe the
        # Asadh season of this Gregorian year (BE = year + 544 at that time).
        kind = chhankitek.leap_type(value.year + 544)
        return KhmerLunarDate(
            gregorian_date=value,
            month=raw.month,
            day=raw.day_number + 1 if waxing else raw.day_number - 14,
            phase=MoonPhase.WAXING if waxing else MoonPhase.WANING,
            day_of_month=raw.day_number + 1,
            days_in_month=chhankitek.days_in_month(raw.month, walk_be),
            be_year=raw.be_year,
            js_year=raw.js_year,
            animal_year=raw.animal_year,
            sak=raw.sak,
            year_has_leap_month=kind == 1,
            year_has_leap_day=kind == 2,
        )

    def to_gregorian(self, query: LunarDateQuery) -> list[date]:
        """Return every Gregorian date matching ``query`` (usually zero or one).

        A BE year runs from ១រោច ពិសាខ of AD ``be_year - 544`` to the day
        before ១រោច ពិសាខ of the following AD year, so only that window is
        scanned.
        """
        start_year = query.be_year - 544
        start = max(date(start_year, 4, 1), self.min_date)
        end = min(date(start_year + 1, 6, 30), self.max_date)
        if start > end:
            raise UnsupportedDateError(f"BE {query.be_year} is outside the supported range")

        matches: list[date] = []
        day = start
        while day <= end:
            lunar = self.to_lunar(day)
            if (
                lunar.be_year == query.be_year
                and lunar.month == query.month
                and lunar.day == query.day
                and lunar.phase == query.phase
            ):
                matches.append(day)
            day += timedelta(days=1)
        return matches

    def khmer_new_year(self, year: int) -> KhmerNewYear:
        if not (self.min_date.year <= year <= self.max_date.year):
            raise UnsupportedDateError(f"Year {year} is outside the supported range")
        info = chhankitek.new_year_info(year)
        return KhmerNewYear(
            moha_songkran=info.moha_songkran,
            lerng_sak=info.lerng_sak,
            number_of_days=info.number_of_days,
        )

    def has_leap_month(self, be_year: int) -> bool:
        return chhankitek.leap_type(be_year) == 1

    def find_in_year(self, year: int, month: LunarMonth, day: int, phase: MoonPhase) -> list[date]:
        """Gregorian dates within AD ``year`` that carry the given lunar day."""
        found: list[date] = []
        current = max(date(year, 1, 1), self.min_date)
        end = min(date(year, 12, 31), self.max_date)
        while current <= end:
            lunar = self.to_lunar(current)
            if lunar.month == month and lunar.day == day and lunar.phase == phase:
                found.append(current)
            current += timedelta(days=1)
        return found


_default_engine = ChhankitekEngine()


def get_engine() -> ChhankitekEngine:
    return _default_engine
