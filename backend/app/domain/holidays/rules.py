"""Traditional lunar rules and fixed-date commemorations.

These rules describe *when an observance traditionally falls*. They do not
make a day an official public holiday: official holidays are set each year by
sub-decree and are stored as sourced records in the database. Occurrences
produced here are always labelled ``calculated``.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from functools import lru_cache

from app.domain.calendar.constants import LunarMonth, MoonPhase, to_khmer_numerals
from app.domain.calendar.engine import ChhankitekEngine


@dataclass(frozen=True)
class LunarObservanceRule:
    key: str
    title_km: str
    title_en: str
    description_km: str
    description_en: str
    month: LunarMonth
    day: int
    phase: MoonPhase
    days_before: int = 0
    days_after: int = 0
    category: str = "buddhist"
    # In adhikameas years Asadh is doubled; observances tied to Asadh follow the second one.
    leap_year_month: LunarMonth | None = None


@dataclass(frozen=True)
class ObservanceOccurrence:
    rule: LunarObservanceRule
    anchor_date: date
    start_date: date
    end_date: date

    @property
    def slug(self) -> str:
        return f"{self.rule.key}-{self.anchor_date.year}"


@dataclass(frozen=True)
class FixedDateRule:
    """A commemoration on the same Gregorian date every year, within the years it has existed."""

    key: str
    title_km: str
    title_en: str
    month: int
    day: int
    category: str
    since: int | None = None
    until: int | None = None

    def applies(self, year: int) -> bool:
        return (self.since is None or year >= self.since) and (self.until is None or year <= self.until)


@dataclass(frozen=True)
class FixedDateOccurrence:
    rule: FixedDateRule
    day: date

    @property
    def slug(self) -> str:
        return f"{self.rule.key}-{self.day.year}"


def _kan_ben_rule(n: int) -> LunarObservanceRule:
    """Kan Ben day *n*: the offering days before Pchum Ben, from the 1st waning day of Phatrabot."""
    return LunarObservanceRule(
        key=f"kan-ben-{n}",
        title_km=f"បិណ្ឌ {to_khmer_numerals(n)}",
        title_en=f"Ben {n}",
        description_km=f"ថ្ងៃកាន់បិណ្ឌទី{to_khmer_numerals(n)} (ថ្ងៃ{to_khmer_numerals(n)}រោច ខែភទ្របទ)។",
        description_en=f"Day {n} of the Kan Ben offerings ({n} waning Phatrabot), leading to Pchum Ben.",
        month=LunarMonth.PHATRABOT,
        day=n,
        phase=MoonPhase.WANING,
        category="traditional",
    )


LUNAR_OBSERVANCES: tuple[LunarObservanceRule, ...] = (
    LunarObservanceRule(
        key="meak-bochea",
        title_km="បុណ្យមាឃបូជា",
        title_en="Meak Bochea",
        description_km="ថ្ងៃ១៥កើត ខែមាឃ រំលឹកដល់សន្និបាតព្រះសង្ឃ ១២៥០អង្គ។",
        description_en="Full moon of Meak, commemorating the assembly of 1,250 monks.",
        month=LunarMonth.MEAK,
        day=15,
        phase=MoonPhase.WAXING,
    ),
    LunarObservanceRule(
        key="visak-bochea",
        title_km="បុណ្យវិសាខបូជា",
        title_en="Visak Bochea",
        description_km="ថ្ងៃ១៥កើត ខែពិសាខ រំលឹកដល់ការប្រសូត ត្រាស់ដឹង និងបរិនិព្វានរបស់ព្រះពុទ្ធ។",
        description_en="Full moon of Pisakh, marking the Buddha's birth, enlightenment and passing.",
        month=LunarMonth.PISAKH,
        day=15,
        phase=MoonPhase.WAXING,
    ),
    LunarObservanceRule(
        key="royal-ploughing-ceremony",
        title_km="ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល",
        title_en="Royal Ploughing Ceremony",
        description_km="ប្រពៃណីប្រារព្ធនៅថ្ងៃ៤រោច ខែពិសាខ។ កាលបរិច្ឆេទផ្លូវការកំណត់ដោយព្រះរាជក្រឹត្យ។",
        description_en=(
            "Traditionally held on the 4th waning day of Pisakh; the official date is fixed by royal decree."
        ),
        month=LunarMonth.PISAKH,
        day=4,
        phase=MoonPhase.WANING,
        category="royal",
    ),
    LunarObservanceRule(
        key="asalha-bochea",
        title_km="អាសាឡ្ហបូជា",
        title_en="Asalha Bochea",
        description_km="ថ្ងៃ១៥កើត ខែអាសាឍ រំលឹកដល់ធម្មទេសនាដំបូងរបស់ព្រះពុទ្ធ។",
        description_en="Full moon of Asadh (second Asadh in leap-month years): the Buddha's first sermon.",
        month=LunarMonth.ASADH,
        day=15,
        phase=MoonPhase.WAXING,
        leap_year_month=LunarMonth.TUTIYASADH,
    ),
    LunarObservanceRule(
        key="buddhist-lent-begins",
        title_km="ចូលព្រះវស្សា",
        title_en="Beginning of Buddhist Lent",
        description_km="ថ្ងៃ១រោច ខែអាសាឍ (ទុតិយាសាឍ ក្នុងឆ្នាំអធិកមាស) ព្រះសង្ឃចូលចាំព្រះវស្សា ៣ខែ។",
        description_en=(
            "1st waning day of Asadh (second Asadh in leap-month years): "
            "monks begin the three-month rains retreat."
        ),
        month=LunarMonth.ASADH,
        day=1,
        phase=MoonPhase.WANING,
        leap_year_month=LunarMonth.TUTIYASADH,
    ),
    *(_kan_ben_rule(n) for n in range(1, 14)),
    LunarObservanceRule(
        key="pchum-ben",
        title_km="បុណ្យភ្ជុំបិណ្ឌ",
        title_en="Pchum Ben",
        description_km="ថ្ងៃ១៥រោច ខែភទ្របទ ជាថ្ងៃបញ្ចប់កាន់បិណ្ឌ ១៥ថ្ងៃ ដើម្បីឧទ្ទិសកុសលដល់បុព្វការីជន។",
        description_en=("15th waning day of Phatrabot, closing fifteen days of offerings to ancestors."),
        month=LunarMonth.PHATRABOT,
        day=15,
        phase=MoonPhase.WANING,
        days_before=1,
        days_after=1,
        category="traditional",
    ),
    LunarObservanceRule(
        key="end-of-buddhist-lent",
        title_km="ចេញព្រះវស្សា",
        title_en="End of Buddhist Lent",
        description_km="ថ្ងៃ១៥កើត ខែអស្សុជ ព្រះសង្ឃចេញព្រះវស្សា។",
        description_en="Full moon of Assoch: the rains retreat ends.",
        month=LunarMonth.ASSOCH,
        day=15,
        phase=MoonPhase.WAXING,
    ),
    LunarObservanceRule(
        key="kathen-season",
        title_km="កឋិនកាល",
        title_en="Kathen season begins",
        description_km="ពី១រោច ខែអស្សុជ ដល់១៥កើត ខែកត្តិក ជារដូវបុណ្យកឋិនទាន។",
        description_en=(
            "Kathen robe-offering season, from the 1st waning day of Assoch to the full moon of Kadeuk."
        ),
        month=LunarMonth.ASSOCH,
        day=1,
        phase=MoonPhase.WANING,
    ),
    LunarObservanceRule(
        key="water-festival",
        title_km="ព្រះរាជពិធីបុណ្យអុំទូក បណ្ដែតប្រទីប និងសំពះព្រះខែ អកអំបុក",
        title_en="Water Festival (Bon Om Touk)",
        description_km="ប្រារព្ធពី ១៤កើត ដល់ ១រោច ខែកត្តិក។",
        description_en="Held from the 14th waxing day to the 1st waning day of Kadeuk.",
        month=LunarMonth.KADEUK,
        day=15,
        phase=MoonPhase.WAXING,
        days_before=1,
        days_after=1,
        category="traditional",
    ),
)

# Keys match sourced holiday slugs (``<key>-<year>``) so both are recognised as the same day.
FIXED_DATE_OBSERVANCES: tuple[FixedDateRule, ...] = (
    FixedDateRule(
        "international-new-year", "ទិវាចូលឆ្នាំសកល", "International New Year Day", 1, 1, "international"
    ),
    FixedDateRule(
        "victory-over-genocide-day",
        "ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍",
        "Victory over Genocide Day",
        1,
        7,
        "national",
        since=1980,
    ),
    FixedDateRule(
        "international-womens-day", "ទិវាអន្តរជាតិនារី", "International Women's Day", 3, 8, "international"
    ),
    FixedDateRule(
        "international-labour-day", "ទិវាពលកម្មអន្តរជាតិ", "International Labour Day", 5, 1, "international"
    ),
    FixedDateRule(
        "king-sihamoni-birthday",
        "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះករុណា ព្រះបាទសម្តេចព្រះបរមនាថ នរោត្តម សីហមុនី",
        "Birthday of His Majesty King Norodom Sihamoni",
        5,
        14,
        "royal",
        since=2005,
    ),
    FixedDateRule(
        "international-childrens-day", "ទិវាកុមារអន្តរជាតិ", "International Children's Day", 6, 1, "international"
    ),
    FixedDateRule(
        "queen-mother-birthday",
        "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម សម្តេចព្រះមហាក្សត្រី នរោត្តម មុនិនាថ សីហនុ",
        "Birthday of Her Majesty Queen Mother Norodom Monineath Sihanouk",
        6,
        18,
        "royal",
        since=2005,
    ),
    FixedDateRule("constitution-day", "ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ", "Constitution Day", 9, 24, "national", since=1993),
    FixedDateRule(
        "world-teachers-day", "ទិវាគ្រូបង្រៀនពិភពលោក", "World Teachers' Day", 10, 5, "international", since=1994
    ),
    FixedDateRule(
        "king-father-commemoration-day",
        "ទិវាប្រារព្ធពិធីគោរពព្រះវិញ្ញាណក្ខន្ធ ព្រះករុណាព្រះបាទសម្តេចព្រះ នរោត្តម សីហនុ",
        "Commemoration Day of King Father Norodom Sihanouk",
        10,
        15,
        "royal",
        since=2013,
    ),
    FixedDateRule(
        "paris-peace-agreements-day",
        "ទិវារំលឹកខួបនៃកិច្ចព្រមព្រៀងសន្តិភាពទីក្រុងប៉ារីស",
        "Paris Peace Agreements Day",
        10,
        23,
        "national",
        since=1992,
    ),
    FixedDateRule(
        "coronation-day",
        "ព្រះរាជពិធីគ្រងព្រះបរមរាជសម្បត្តិ ព្រះករុណា ព្រះបាទសម្តេចព្រះបរមនាថ នរោត្តម សីហមុនី",
        "Coronation Day of His Majesty King Norodom Sihamoni",
        10,
        29,
        "royal",
        since=2004,
    ),
    FixedDateRule(
        "king-father-birthday",
        "ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះករុណាព្រះបាទសម្តេចព្រះ នរោត្តម សីហនុ",
        "Birthday of King Father Norodom Sihanouk",
        10,
        31,
        "royal",
        until=2012,
    ),
    FixedDateRule("independence-day", "ពិធីបុណ្យឯករាជ្យជាតិ", "Independence Day", 11, 9, "national", since=1953),
    FixedDateRule(
        "human-rights-day", "ទិវាសិទ្ធិមនុស្សអន្តរជាតិ", "International Human Rights Day", 12, 10, "international"
    ),
    FixedDateRule("valentines-day", "ថ្ងៃបុណ្យនៃសេចក្តីស្រលាញ់", "Valentine's Day", 2, 14, "international"),
    FixedDateRule(
        "national-mine-awareness-day",
        "ទិវាជាតិយល់ដឹងពីមីន",
        "National Mine Awareness Day",
        2,
        24,
        "national",
        since=2000,
    ),
    FixedDateRule(
        "national-culture-day", "ទិវាវប្បធម៌ជាតិ", "National Culture Day", 3, 3, "national", since=1999
    ),
    FixedDateRule("halloween", "បុណ្យហាឡូវីន", "Halloween", 10, 31, "international"),
    FixedDateRule("christmas-day", "បុណ្យណូអែល", "Christmas Day", 12, 25, "international"),
    FixedDateRule("peace-day", "ទិវាសន្តិភាពនៅកម្ពុជា", "Peace Day in Cambodia", 12, 29, "national", since=2024),
)


@lru_cache(maxsize=256)
def occurrences_in_year(engine: ChhankitekEngine, year: int) -> tuple[ObservanceOccurrence, ...]:
    # One pass over the year's lunar dates serves every rule.
    by_lunar_day: dict[tuple[LunarMonth, int, MoonPhase], list[date]] = {}
    current = max(date(year, 1, 1), engine.min_date)
    end = min(date(year, 12, 31), engine.max_date)
    while current <= end:
        lunar = engine.to_lunar(current)
        by_lunar_day.setdefault((lunar.month, lunar.day, lunar.phase), []).append(current)
        current += timedelta(days=1)

    found: list[ObservanceOccurrence] = []
    for rule in LUNAR_OBSERVANCES:
        anchors = by_lunar_day.get((rule.month, rule.day, rule.phase), [])
        if not anchors and rule.leap_year_month is not None:
            anchors = by_lunar_day.get((rule.leap_year_month, rule.day, rule.phase), [])
        for anchor in anchors:
            found.append(
                ObservanceOccurrence(
                    rule=rule,
                    anchor_date=anchor,
                    start_date=anchor - timedelta(days=rule.days_before),
                    end_date=anchor + timedelta(days=rule.days_after),
                )
            )
    return tuple(sorted(found, key=lambda o: o.start_date))


def fixed_date_occurrences(year: int) -> list[FixedDateOccurrence]:
    return [
        FixedDateOccurrence(rule, date(year, rule.month, rule.day))
        for rule in FIXED_DATE_OBSERVANCES
        if rule.applies(year)
    ]


# Rules whose days are normally public holidays. They are shown as *expected* public holidays
# (calculated, never official) wherever no sourced holiday record exists for that year.
# Values are (first year, last year); None is open-ended. From 2020 the government removed
# Meak Bochea, Children's Day, Paris Peace Agreements Day and Human Rights Day from the list.
EXPECTED_PUBLIC_HOLIDAYS: dict[str, tuple[int | None, int | None]] = {
    "international-new-year": (None, None),
    "victory-over-genocide-day": (None, None),
    "meak-bochea": (None, 2019),
    "international-womens-day": (None, None),
    "khmer-new-year-songkran": (None, None),
    "international-labour-day": (None, None),
    "visak-bochea": (None, None),
    "royal-ploughing-ceremony": (None, None),
    "king-sihamoni-birthday": (None, None),
    "international-childrens-day": (None, 2019),
    "queen-mother-birthday": (None, None),
    "constitution-day": (None, None),
    "pchum-ben": (None, None),
    "king-father-commemoration-day": (None, None),
    "paris-peace-agreements-day": (None, 2019),
    "coronation-day": (None, None),
    "king-father-birthday": (None, None),
    "independence-day": (None, None),
    "water-festival": (None, None),
    "human-rights-day": (None, 2019),
    "peace-day": (2024, None),
}


def is_expected_public_holiday(key: str, year: int) -> bool:
    window = EXPECTED_PUBLIC_HOLIDAYS.get(key)
    if window is None:
        return False
    first, last = window
    return (first is None or year >= first) and (last is None or year <= last)


# First day of the Chinese lunisolar year (a different calendar from the Khmer Chhankitek one).
# Dates match ICU's Chinese calendar, except 2027 and 2030, where the new moon falls within minutes
# of midnight Beijing time and the published dates (Purple Mountain Observatory) are one day off ICU.
CHINESE_NEW_YEAR: dict[int, date] = {
    2000: date(2000, 2, 5), 2001: date(2001, 1, 24), 2002: date(2002, 2, 12), 2003: date(2003, 2, 1),
    2004: date(2004, 1, 22), 2005: date(2005, 2, 9), 2006: date(2006, 1, 29), 2007: date(2007, 2, 18),
    2008: date(2008, 2, 7), 2009: date(2009, 1, 26), 2010: date(2010, 2, 14), 2011: date(2011, 2, 3),
    2012: date(2012, 1, 23), 2013: date(2013, 2, 10), 2014: date(2014, 1, 31), 2015: date(2015, 2, 19),
    2016: date(2016, 2, 8), 2017: date(2017, 1, 28), 2018: date(2018, 2, 16), 2019: date(2019, 2, 5),
    2020: date(2020, 1, 25), 2021: date(2021, 2, 12), 2022: date(2022, 2, 1), 2023: date(2023, 1, 22),
    2024: date(2024, 2, 10), 2025: date(2025, 1, 29), 2026: date(2026, 2, 17), 2027: date(2027, 2, 6),
    2028: date(2028, 1, 26), 2029: date(2029, 2, 13), 2030: date(2030, 2, 3),
}  # fmt: skip

# Celebrated for three days in Cambodia, starting on New Year's Day.
CHINESE_NEW_YEAR_DAYS = 3
