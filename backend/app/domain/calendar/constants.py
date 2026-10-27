"""Khmer lunar calendar vocabulary: month, phase, weekday, animal and era names."""

from __future__ import annotations

from enum import IntEnum, StrEnum


class LunarMonth(IntEnum):
    """Khmer lunar months in Chhankitek order.

    ``PATHAMASADH`` and ``TUTIYASADH`` (first and second Asadh) replace
    ``ASADH`` in adhikameas (leap-month) years.
    """

    MIGASIR = 0
    BOSS = 1
    MEAK = 2
    PHALKUN = 3
    CHEIT = 4
    PISAKH = 5
    JESTH = 6
    ASADH = 7
    SRAP = 8
    PHATRABOT = 9
    ASSOCH = 10
    KADEUK = 11
    PATHAMASADH = 12
    TUTIYASADH = 13

    @property
    def slug(self) -> str:
        return self.name.lower()

    @classmethod
    def from_slug(cls, slug: str) -> LunarMonth:
        return cls[slug.upper()]


class MoonPhase(StrEnum):
    WAXING = "waxing"  # កើត
    WANING = "waning"  # រោច


LUNAR_MONTH_NAMES_KM: dict[LunarMonth, str] = {
    LunarMonth.MIGASIR: "មិគសិរ",
    LunarMonth.BOSS: "បុស្ស",
    LunarMonth.MEAK: "មាឃ",
    LunarMonth.PHALKUN: "ផល្គុន",
    LunarMonth.CHEIT: "ចេត្រ",
    LunarMonth.PISAKH: "ពិសាខ",
    LunarMonth.JESTH: "ជេស្ឋ",
    LunarMonth.ASADH: "អាសាឍ",
    LunarMonth.SRAP: "ស្រាពណ៍",
    LunarMonth.PHATRABOT: "ភទ្របទ",
    LunarMonth.ASSOCH: "អស្សុជ",
    LunarMonth.KADEUK: "កត្តិក",
    LunarMonth.PATHAMASADH: "បឋមាសាឍ",
    LunarMonth.TUTIYASADH: "ទុតិយាសាឍ",
}

LUNAR_MONTH_NAMES_EN: dict[LunarMonth, str] = {
    LunarMonth.MIGASIR: "Migasir",
    LunarMonth.BOSS: "Boss",
    LunarMonth.MEAK: "Meak",
    LunarMonth.PHALKUN: "Phalkun",
    LunarMonth.CHEIT: "Cheit",
    LunarMonth.PISAKH: "Pisakh",
    LunarMonth.JESTH: "Jesth",
    LunarMonth.ASADH: "Asadh",
    LunarMonth.SRAP: "Srap",
    LunarMonth.PHATRABOT: "Phatrabot",
    LunarMonth.ASSOCH: "Assoch",
    LunarMonth.KADEUK: "Kadeuk",
    LunarMonth.PATHAMASADH: "Pathamasadh (First Asadh)",
    LunarMonth.TUTIYASADH: "Tutiyasadh (Second Asadh)",
}

PHASE_NAMES_KM = {MoonPhase.WAXING: "កើត", MoonPhase.WANING: "រោច"}
PHASE_NAMES_EN = {MoonPhase.WAXING: "Waxing", MoonPhase.WANING: "Waning"}

# Python weekday(): Monday == 0
WEEKDAY_NAMES_KM = ["ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍", "អាទិត្យ"]
WEEKDAY_NAMES_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

ANIMAL_YEAR_NAMES_KM = [
    "ជូត", "ឆ្លូវ", "ខាល", "ថោះ", "រោង", "ម្សាញ់",
    "មមី", "មមែ", "វក", "រកា", "ច", "កុរ",
]  # fmt: skip
ANIMAL_YEAR_NAMES_EN = [
    "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake",
    "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig",
]  # fmt: skip

SAK_NAMES_KM = [
    "សំរឹទ្ធិស័ក", "ឯកស័ក", "ទោស័ក", "ត្រីស័ក", "ចត្វាស័ក",
    "បញ្ចស័ក", "ឆស័ក", "សប្តស័ក", "អដ្ឋស័ក", "នព្វស័ក",
]  # fmt: skip
SAK_NAMES_EN = [
    "Samridhi Sak", "Ek Sak", "To Sak", "Trei Sak", "Chattva Sak",
    "Pancha Sak", "Chha Sak", "Sappa Sak", "Attha Sak", "Nappa Sak",
]  # fmt: skip

KHMER_DIGITS = str.maketrans("0123456789", "០១២៣៤៥៦៧៨៩")


def to_khmer_numerals(value: int | str) -> str:
    return str(value).translate(KHMER_DIGITS)
