"""Khmer and English presentation of calculated lunar dates."""

from __future__ import annotations

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
    MoonPhase,
    to_khmer_numerals,
)
from app.domain.calendar.types import KhmerLunarDate


def format_lunar_km(lunar: KhmerLunarDate) -> str:
    """e.g. ``ថ្ងៃអង្គារ ១រោច ខែអស្សុជ ឆ្នាំមមី អដ្ឋស័ក ពុទ្ធសករាជ ២៥៧០``."""
    weekday = WEEKDAY_NAMES_KM[lunar.gregorian_date.weekday()]
    return (
        f"ថ្ងៃ{weekday} {to_khmer_numerals(lunar.day)}{PHASE_NAMES_KM[lunar.phase]} "
        f"ខែ{LUNAR_MONTH_NAMES_KM[lunar.month]} ឆ្នាំ{ANIMAL_YEAR_NAMES_KM[lunar.animal_year]} "
        f"{SAK_NAMES_KM[lunar.sak]} ពុទ្ធសករាជ {to_khmer_numerals(lunar.be_year)}"
    )


def format_lunar_short_km(lunar: KhmerLunarDate) -> str:
    """e.g. ``១រោច ខែអស្សុជ``."""
    return (
        f"{to_khmer_numerals(lunar.day)}{PHASE_NAMES_KM[lunar.phase]} ខែ{LUNAR_MONTH_NAMES_KM[lunar.month]}"
    )


def _ordinal(n: int) -> str:
    suffix = "th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def format_lunar_en(lunar: KhmerLunarDate) -> str:
    """e.g. ``Tuesday, 1st waning day of Assoch, Year of the Horse, Attha Sak, BE 2570``."""
    weekday = WEEKDAY_NAMES_EN[lunar.gregorian_date.weekday()]
    phase = "waxing" if lunar.phase is MoonPhase.WAXING else "waning"
    return (
        f"{weekday}, {_ordinal(lunar.day)} {phase} day of {LUNAR_MONTH_NAMES_EN[lunar.month]}, "
        f"Year of the {ANIMAL_YEAR_NAMES_EN[lunar.animal_year]}, {SAK_NAMES_EN[lunar.sak]}, "
        f"BE {lunar.be_year}"
    )


def format_lunar_short_en(lunar: KhmerLunarDate) -> str:
    phase = "waxing" if lunar.phase is MoonPhase.WAXING else "waning"
    return f"{lunar.day} {phase}, {LUNAR_MONTH_NAMES_EN[lunar.month]}"
