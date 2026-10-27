from __future__ import annotations

from datetime import date

from app.domain.calendar.constants import LunarMonth, MoonPhase, to_khmer_numerals
from app.domain.calendar.engine import ChhankitekEngine
from app.domain.calendar.formatting import format_lunar_en, format_lunar_km, format_lunar_short_km
from app.domain.calendar.validation import (
    CalendarValidationService,
    DateVerification,
    ReferenceLunarDate,
)
from app.domain.holidays.rules import fixed_date_occurrences, occurrences_in_year

engine = ChhankitekEngine()


def test_khmer_numerals() -> None:
    assert to_khmer_numerals(2570) == "២៥៧០"


def test_khmer_format() -> None:
    lunar = engine.to_lunar(date(2025, 12, 10))
    assert format_lunar_km(lunar) == "ថ្ងៃពុធ ៥រោច ខែមិគសិរ ឆ្នាំម្សាញ់ សប្តស័ក ពុទ្ធសករាជ ២៥៦៩"
    assert format_lunar_short_km(lunar) == "៥រោច ខែមិគសិរ"


def test_english_format() -> None:
    lunar = engine.to_lunar(date(2026, 10, 27))
    assert format_lunar_en(lunar).startswith("Tuesday, 1st waning day of Assoch, Year of the Horse")


def _reference(month: LunarMonth, day: int, phase: MoonPhase) -> ReferenceLunarDate:
    return ReferenceLunarDate(
        gregorian_date=date(2026, 10, 11),
        month=month,
        day=day,
        phase=phase,
        source_name="test",
        source_url=None,
        verification_status="secondary_source",
    )


def test_validation_statuses() -> None:
    service = CalendarValidationService()
    lunar = engine.to_lunar(date(2026, 10, 11))
    assert service.validate(lunar, None).verification is DateVerification.CALCULATED

    agree = service.validate(lunar, _reference(LunarMonth.PHATRABOT, 15, MoonPhase.WANING))
    assert agree.verification is DateVerification.VERIFIED

    disagree = service.validate(lunar, _reference(LunarMonth.PHATRABOT, 14, MoonPhase.WANING))
    assert disagree.verification is DateVerification.OVERRIDDEN
    assert disagree.lunar.day == 14 and disagree.lunar.day_of_month == 29
    assert disagree.calculated == lunar


def test_observance_rules_2026() -> None:
    by_key = {o.rule.key: o for o in occurrences_in_year(engine, 2026)}
    assert by_key["visak-bochea"].anchor_date == date(2026, 5, 1)
    assert by_key["royal-ploughing-ceremony"].anchor_date == date(2026, 5, 5)
    assert (by_key["pchum-ben"].start_date, by_key["pchum-ben"].end_date) == (
        date(2026, 10, 10),
        date(2026, 10, 12),
    )
    assert (by_key["water-festival"].start_date, by_key["water-festival"].end_date) == (
        date(2026, 11, 23),
        date(2026, 11, 25),
    )


def test_buddhist_season_rules_2026_match_published_calendars() -> None:
    # October 2026 on printed Khmer calendars: Ben 13 on the 9th, End of Lent on the 26th, Kathen the 27th.
    by_key = {o.rule.key: o.anchor_date for o in occurrences_in_year(engine, 2026)}
    assert by_key["kan-ben-1"] == date(2026, 9, 27)
    assert by_key["kan-ben-13"] == date(2026, 10, 9)
    assert by_key["end-of-buddhist-lent"] == date(2026, 10, 26)
    assert by_key["kathen-season"] == date(2026, 10, 27)
    assert by_key["buddhist-lent-begins"] == date(2026, 7, 30)


def test_buddhist_lent_follows_second_asadh_in_leap_month_years() -> None:
    lent = [o for o in occurrences_in_year(engine, 2023) if o.rule.key == "buddhist-lent-begins"]
    assert [o.anchor_date for o in lent] == [date(2023, 8, 2)]  # 2023 has two Asadh months
    lunar = engine.to_lunar(lent[0].anchor_date)
    assert lunar.month == LunarMonth.TUTIYASADH and lunar.day == 1 and lunar.phase == MoonPhase.WANING


def test_fixed_date_rules_respect_the_years_they_existed() -> None:
    keys = lambda year: {o.rule.key for o in fixed_date_occurrences(year)}  # noqa: E731
    assert "coronation-day" not in keys(2003) and "coronation-day" in keys(2004)
    assert "king-father-birthday" in keys(2012) and "king-father-birthday" not in keys(2013)
    assert "king-father-commemoration-day" in keys(2013)
    assert {o.day for o in fixed_date_occurrences(2030) if o.rule.key == "independence-day"} == {
        date(2030, 11, 9)
    }


def test_shaving_day_is_the_eve_of_full_and_new_moon() -> None:
    # February 2027: 5 Feb = ១៤រោច before the new moon, 20 Feb = ១៤កើត before the full moon.
    assert engine.to_lunar(date(2027, 2, 5)).is_shaving_day
    assert engine.to_lunar(date(2027, 2, 6)).is_new_moon
    assert engine.to_lunar(date(2027, 2, 20)).is_shaving_day
    assert engine.to_lunar(date(2027, 2, 21)).is_full_moon
    assert not engine.to_lunar(date(2027, 2, 22)).is_shaving_day
