"""Value objects shared by every calendar engine implementation."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime

from app.domain.calendar.constants import LunarMonth, MoonPhase

SUPPORTED_MIN_DATE = date(1900, 1, 1)
SUPPORTED_MAX_DATE = date(2100, 12, 31)


@dataclass(frozen=True)
class KhmerLunarDate:
    """A calculated Khmer lunar date for one Gregorian day."""

    gregorian_date: date
    month: LunarMonth
    day: int  # 1..15 within the phase
    phase: MoonPhase
    day_of_month: int  # 1..30 counted from ១កើត
    days_in_month: int  # 29 or 30
    be_year: int  # Buddhist Era (ពុទ្ធសករាជ); increments on ១រោច ខែពិសាខ
    js_year: int  # Jolak Sakaraj (ចុល្លសករាជ)
    animal_year: int  # 0 = Rat … 11 = Pig
    sak: int  # 0..9 era cycle (ស័ក)
    year_has_leap_month: bool  # this Gregorian year's Asadh is doubled (អធិកមាស)
    year_has_leap_day: bool  # this Gregorian year's Jesth has 30 days (ចន្ទ្រាធិមាស)

    @property
    def is_full_moon(self) -> bool:
        return self.phase is MoonPhase.WAXING and self.day == 15

    @property
    def is_new_moon(self) -> bool:
        """Last day of the lunar month (១៤ or ១៥ រោច)."""
        return self.day_of_month == self.days_in_month

    @property
    def is_sila_day(self) -> bool:
        """Buddhist precept day (ថ្ងៃសីល): ៨កើត, ១៥កើត, ៨រោច and the last day."""
        return self.day == 8 or self.is_full_moon or self.is_new_moon

    @property
    def is_shaving_day(self) -> bool:
        """ថ្ងៃកោរ: eve of the full-moon and new-moon holy days (១៤កើត, and the day before the last day)."""
        return (
            self.phase is MoonPhase.WAXING and self.day == 14
        ) or self.day_of_month == self.days_in_month - 1


@dataclass(frozen=True)
class LunarDateQuery:
    """Reverse-conversion input. ``be_year`` follows the ១រោច ពិសាខ boundary."""

    be_year: int
    month: LunarMonth
    day: int
    phase: MoonPhase


@dataclass(frozen=True)
class KhmerNewYear:
    moha_songkran: datetime
    lerng_sak: date
    number_of_days: int


class UnsupportedDateError(ValueError):
    """Raised when a date is outside the engine's supported range."""
