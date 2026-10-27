from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.domain.calendar.constants import LunarMonth, MoonPhase
from app.domain.calendar.engine import ChhankitekEngine
from app.domain.calendar.types import LunarDateQuery, UnsupportedDateError

engine = ChhankitekEngine()


def test_matches_independent_reference_dates(reference_dates: list[dict[str, object]]) -> None:
    for ref in reference_dates:
        lunar = engine.to_lunar(date.fromisoformat(str(ref["date"])))
        assert lunar.month.slug == ref["month"], ref
        assert lunar.day == ref["day"], ref
        assert lunar.phase.value == ref["phase"], ref
        if "be_year" in ref:
            assert lunar.be_year == ref["be_year"], ref
        if "animal_year" in ref:
            assert lunar.animal_year == ref["animal_year"], ref
        if "sak" in ref:
            assert lunar.sak == ref["sak"], ref


def test_consecutive_days_advance_by_one_lunar_day() -> None:
    """Structural invariant over 1900-2100: no skipped or repeated lunar days."""
    day = date(1900, 1, 2)
    prev = engine.to_lunar(date(1900, 1, 1))
    while day <= date(2100, 12, 31):
        cur = engine.to_lunar(day)
        if prev.day_of_month == prev.days_in_month:
            assert cur.day_of_month == 1, (day, prev, cur)
            assert cur.month != prev.month, day
        else:
            assert cur.day_of_month == prev.day_of_month + 1, (day, prev, cur)
            assert cur.month == prev.month, day
        prev = cur
        day += timedelta(days=1)


def test_month_boundary() -> None:
    # Pchum Ben 2026: last day of Phatrabot followed by 1 កើត Assoch.
    last = engine.to_lunar(date(2026, 10, 11))
    first = engine.to_lunar(date(2026, 10, 12))
    assert (last.month, last.day, last.phase) == (LunarMonth.PHATRABOT, 15, MoonPhase.WANING)
    assert last.is_new_moon
    assert (first.month, first.day, first.phase) == (LunarMonth.ASSOCH, 1, MoonPhase.WAXING)


def test_be_year_changes_on_first_waning_day_of_pisakh() -> None:
    full_moon = engine.to_lunar(date(2026, 5, 1))
    next_day = engine.to_lunar(date(2026, 5, 2))
    assert full_moon.is_full_moon and full_moon.be_year == 2569
    assert next_day.day == 1 and next_day.phase is MoonPhase.WANING and next_day.be_year == 2570


def test_gregorian_year_boundary_keeps_lunar_continuity() -> None:
    dec31 = engine.to_lunar(date(2025, 12, 31))
    jan1 = engine.to_lunar(date(2026, 1, 1))
    assert jan1.be_year == dec31.be_year
    if dec31.is_new_moon:
        assert jan1.day_of_month == 1
    else:
        assert jan1.day_of_month == dec31.day_of_month + 1


@pytest.mark.parametrize("year", [2021, 2023, 2026, 2029])
def test_leap_month_years_have_two_asadh_months(year: int) -> None:
    months = {engine.to_lunar(date(year, 1, 1) + timedelta(days=i)).month for i in range(365)}
    assert LunarMonth.PATHAMASADH in months and LunarMonth.TUTIYASADH in months
    assert LunarMonth.ASADH not in months
    assert engine.to_lunar(date(year, 7, 1)).year_has_leap_month


@pytest.mark.parametrize("year", [2022, 2024, 2025, 2027])
def test_regular_years_have_single_asadh(year: int) -> None:
    months = {engine.to_lunar(date(year, 1, 1) + timedelta(days=i)).month for i in range(365)}
    assert LunarMonth.ASADH in months
    assert LunarMonth.PATHAMASADH not in months


def test_leap_day_year_has_30_day_jesth() -> None:
    lengths = {
        engine.to_lunar(date(2025, 1, 1) + timedelta(days=i)).days_in_month
        for i in range(365)
        if engine.to_lunar(date(2025, 1, 1) + timedelta(days=i)).month == LunarMonth.JESTH
    }
    assert lengths == {30}
    assert engine.to_lunar(date(2025, 6, 1)).year_has_leap_day


def test_reverse_conversion_round_trip() -> None:
    query = LunarDateQuery(be_year=2570, month=LunarMonth.ASSOCH, day=1, phase=MoonPhase.WANING)
    assert engine.to_gregorian(query) == [date(2026, 10, 27)]


def test_reverse_conversion_rejects_asadh_in_leap_year() -> None:
    query = LunarDateQuery(be_year=2570, month=LunarMonth.ASADH, day=1, phase=MoonPhase.WAXING)
    assert engine.to_gregorian(query) == []


@pytest.mark.parametrize("value", [date(1899, 12, 31), date(2101, 1, 1)])
def test_unsupported_range(value: date) -> None:
    with pytest.raises(UnsupportedDateError):
        engine.to_lunar(value)


def test_khmer_new_year_2026_within_official_holiday() -> None:
    ny = engine.khmer_new_year(2026)
    # Sub-Decree 167 sets Khmer New Year holidays on 14-16 April 2026.
    assert ny.moha_songkran.date() == date(2026, 4, 14)
    assert ny.lerng_sak == date(2026, 4, 16)


def test_sila_days() -> None:
    assert engine.to_lunar(date(2026, 10, 26)).is_sila_day  # 15 កើត
    assert not engine.to_lunar(date(2026, 10, 27)).is_sila_day  # 1 រោច
