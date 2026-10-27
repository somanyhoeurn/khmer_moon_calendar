"""Chhankitek (ចន្ទគតិ) Khmer lunar calendar arithmetic.

This module is a Python port of the calculation core of MomentKH
(https://github.com/ThyrithSor/momentkh, ``momentkh.ts`` v3.x, MIT License,
Copyright (c) 2018 ThyrithSor). MomentKH itself implements the traditional
Chhankitek method documented by Phylypo Tum ("Khmer Calendar", 2015).

The port is intentionally faithful so that its output can be compared
one-to-one with the upstream library. Known, deliberate deviations are marked
with ``DEVIATION`` comments and documented in ``docs/calendar/date-conversion.md``.

All values here are *calculated*. Nothing in this module is an authoritative
source of dates; see ``CalendarValidationService`` for how calculations are
reconciled with published references.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from functools import lru_cache

from app.domain.calendar.constants import LunarMonth

EPOCH = date(1900, 1, 1)  # ១កើត ខែបុស្ស (dayNumber 0, month Boss)
EPOCH_MONTH = LunarMonth.BOSS

# Upstream hard-coded New Year (Moha Songkran) moments that override the
# astronomical estimate. Kept verbatim from MomentKH.
_NEW_YEAR_OVERRIDES: dict[int, datetime] = {
    1879: datetime(1879, 4, 12, 11, 36),
    1897: datetime(1897, 4, 13, 2, 0),
    2011: datetime(2011, 4, 14, 13, 12),
    2012: datetime(2012, 4, 14, 19, 11),
    2013: datetime(2013, 4, 14, 2, 12),
    2014: datetime(2014, 4, 14, 8, 7),
    2015: datetime(2015, 4, 14, 14, 2),
    2024: datetime(2024, 4, 13, 22, 17),
}


# ---------------------------------------------------------------------------
# Era helpers
# ---------------------------------------------------------------------------


def ad_to_js(ad_year: int) -> int:
    return ad_year - 638


def be_to_js(be_year: int) -> int:
    return be_year - 1182


def maybe_be_year(year: int, month: int) -> int:
    """Approximate BE year used by the day-counting walk (changes after April)."""
    return year + 543 if month <= 4 else year + 544


# ---------------------------------------------------------------------------
# Year characteristics (BE-year based)
# ---------------------------------------------------------------------------


def aharkun(be_year: int) -> int:
    return (be_year * 292207 + 499) // 800 + 4


def kromthupul(be_year: int) -> int:
    return 800 - (be_year * 292207 + 499) % 800


def avoman(be_year: int) -> int:
    return (aharkun(be_year) * 11 + 25) % 692


def bodithey(be_year: int) -> int:
    ahk = aharkun(be_year)
    return ((ahk * 11 + 25) // 692 + ahk + 29) % 30


def is_solar_leap(be_year: int) -> bool:
    return kromthupul(be_year) <= 207


def is_leap_day_by_calculation(be_year: int) -> bool:
    avm = avoman(be_year)
    if avm == 0 and avoman(be_year - 1) == 137:
        return True
    if is_solar_leap(be_year):
        return avm < 127
    if avm == 137 and avoman(be_year + 1) == 0:
        return False
    return avm < 138


def is_leap_month(be_year: int) -> bool:
    """Adhikameas (អធិកមាស): the year has a doubled Asadh month."""
    bdt = bodithey(be_year)
    bdt_next = bodithey(be_year + 1)
    if bdt == 25 and bdt_next == 5:
        return False
    return (bdt == 24 and bdt_next == 6) or bdt >= 25 or bdt < 6


@lru_cache(maxsize=1024)
def leap_type(be_year: int) -> int:
    """0 = regular, 1 = leap month (អធិកមាស), 2 = leap day (ចន្ទ្រាធិមាស).

    A leap day that falls in an adhikameas year is carried forward to the
    next non-leap-month year.
    """
    if is_leap_month(be_year):
        return 1
    if is_leap_day_by_calculation(be_year):
        return 2
    if is_leap_month(be_year - 1):
        previous = be_year - 1
        while True:
            if is_leap_day_by_calculation(previous):
                return 2
            previous -= 1
            if not is_leap_month(previous):
                return 0
    return 0


def days_in_month(month: LunarMonth, be_year: int) -> int:
    kind = leap_type(be_year)
    if month == LunarMonth.JESTH and kind == 2:
        return 30
    if month in (LunarMonth.PATHAMASADH, LunarMonth.TUTIYASADH):
        return 30 if kind == 1 else 0
    return 29 if month % 2 == 0 else 30


def days_in_year(be_year: int) -> int:
    kind = leap_type(be_year)
    if kind == 1:
        return 384
    if kind == 2:
        return 355
    return 354


def next_month(month: LunarMonth, be_year: int) -> LunarMonth:
    if month == LunarMonth.JESTH and leap_type(be_year) == 1:
        return LunarMonth.PATHAMASADH
    if month == LunarMonth.KADEUK:
        return LunarMonth.MIGASIR
    if month == LunarMonth.PATHAMASADH:
        return LunarMonth.TUTIYASADH
    if month == LunarMonth.TUTIYASADH:
        return LunarMonth.SRAP
    return LunarMonth(month + 1)


# ---------------------------------------------------------------------------
# Khmer New Year (JS-year based astronomical estimate)
# ---------------------------------------------------------------------------


def _aharkun_js(js_year: int) -> int:
    return (js_year * 292207 + 373) // 800 + 1


def _avoman_js(js_year: int) -> int:
    return (_aharkun_js(js_year) * 11 + 650) % 692


def _kromthupul_js(js_year: int) -> int:
    return 800 - (292207 * js_year + 373) % 800


def _bodithey_js(js_year: int) -> int:
    ahk = _aharkun_js(js_year)
    return (ahk + (11 * ahk + 650) // 692) % 30


def _is_adhikameas_js(js_year: int) -> bool:
    bdt = _bodithey_js(js_year)
    bdt_next = _bodithey_js(js_year + 1)
    if bdt == 24 and bdt_next == 6:
        return True
    if bdt == 25 and bdt_next == 5:
        return False
    return bdt > 24 or bdt < 6


def _is_chantrathimeas_js(js_year: int) -> bool:
    avm = _avoman_js(js_year)
    avm_next = _avoman_js(js_year + 1)
    avm_prev = _avoman_js(js_year - 1)
    solar_leap = _kromthupul_js(js_year) <= 207
    if avm == 0 and avm_prev == 137:
        return True
    if solar_leap:
        return avm < 127
    if avm == 137 and avm_next == 0:
        return False
    return avm < 138


@dataclass(frozen=True)
class _SunInfo:
    angsar: int
    libda: int


_CHHAYA_SUN = [(35, 0), (32, 35), (27, 67), (22, 94), (13, 116), (5, 129)]


def _sun_info(js_year: int, sotin: int) -> _SunInfo:
    r2 = 800 * sotin + _kromthupul_js(js_year - 1)
    reasey = r2 // 24350
    r3 = r2 % 24350
    angsar = r3 // 811
    libda = (r3 % 811) // 14 - 3
    sun_average = 1800 * reasey + 60 * angsar + libda

    s1 = 1800 * 2 + 60 * 20
    left_over = sun_average - s1
    if sun_average < s1:
        left_over += 1800 * 12
    kaen = left_over // 1800

    # NOTE: upstream assigns ``kaen`` (not ``left_over``) for kaen 0..2. Kept
    # verbatim so results stay comparable with MomentKH.
    if kaen in (0, 1, 2):
        rs = kaen
    elif kaen in (3, 4, 5):
        rs = 1800 * 6 - left_over
    elif kaen in (6, 7, 8):
        rs = left_over - 1800 * 6
    else:
        rs = (1800 * 11 + 60 * 29 + 60) - left_over

    lo_reasey, lo_angsar, lo_libda = rs // 1800, (rs % 1800) // 60, rs % 60
    if lo_angsar >= 15:
        khan = 2 * lo_reasey + 1
        pouichalip = 60 * (lo_angsar - 15) + lo_libda
    else:
        khan = 2 * lo_reasey
        pouichalip = 60 * lo_angsar + lo_libda

    multiplicity, chhaya = _CHHAYA_SUN[khan] if khan <= 5 else (0, 134)
    phol = (pouichalip * multiplicity) // 900 + chhaya
    inauguration = sun_average - phol if kaen <= 5 else sun_average + phol
    return _SunInfo(angsar=(inauguration % 1800) // 60, libda=inauguration % 60)


@dataclass(frozen=True)
class NewYearInfo:
    """Calculated Moha Songkran moment and the Lerng Sak (era change) day."""

    moha_songkran: datetime
    lerng_sak: date
    number_of_days: int  # 3 or 4 celebration days
    is_upstream_override: bool


@lru_cache(maxsize=512)
def new_year_info(ce_year: int) -> NewYearInfo:
    js_year = ad_to_js(ce_year)
    sotins = [363, 364, 365, 366] if _kromthupul_js(js_year - 1) <= 207 else [362, 363, 364, 365]
    suns = [_sun_info(js_year, s) for s in sotins]

    ny_time = time(0, 0)
    for sun in suns:
        if sun.angsar == 0:
            minutes = 24 * 60 - sun.libda * 24
            ny_time = time((minutes // 60) % 24, minutes % 60)
            break

    bdt = _bodithey_js(js_year)
    if _is_adhikameas_js(js_year - 1) and _is_chantrathimeas_js(js_year - 1):
        bdt = (bdt + 1) % 30
    lerng_sak_day = bdt - 1 if bdt >= 6 else bdt
    lerng_sak_month = 4 if bdt >= 6 else 5  # Cheit or Pisakh

    number_of_days = 4 if suns[0].angsar == 0 else 3

    epoch_lerng_sak = date(ce_year, 4, 17)
    kh_epoch = _walk(epoch_lerng_sak)
    diff = ((kh_epoch.month - 4) * 29 + kh_epoch.day_number) - ((lerng_sak_month - 4) * 29 + lerng_sak_day)
    ny_date = epoch_lerng_sak - timedelta(days=diff + number_of_days - 1)

    override = _NEW_YEAR_OVERRIDES.get(ce_year)
    if override is not None:
        ny_date, ny_time = override.date(), override.time()

    return NewYearInfo(
        moha_songkran=datetime.combine(ny_date, ny_time),
        lerng_sak=ny_date + timedelta(days=number_of_days - 1),
        number_of_days=number_of_days,
        is_upstream_override=override is not None,
    )


# ---------------------------------------------------------------------------
# Gregorian -> lunar day walk
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class _WalkResult:
    month: LunarMonth
    day_number: int  # 0..29; 0-14 waxing, 15-29 waning


def _walk(target: date) -> _WalkResult:
    """Count lunar years, months and days from the 1900-01-01 epoch."""
    epoch = EPOCH
    month = EPOCH_MONTH
    diff = (target - epoch).days

    if diff > 0:
        while True:
            length = days_in_year(maybe_be_year(epoch.year + 1, epoch.month))
            if diff > length:
                diff -= length
                epoch += timedelta(days=length)
            else:
                break
    elif diff < 0:
        while diff < 0:
            length = days_in_year(maybe_be_year(epoch.year, epoch.month))
            diff += length
            epoch -= timedelta(days=length)

    while diff > 0:
        be = maybe_be_year(epoch.year, epoch.month)
        length = days_in_month(month, be)
        if diff > length:
            diff -= length
            epoch += timedelta(days=length)
            month = next_month(month, be)
        else:
            break

    final_be = maybe_be_year(target.year, target.month)
    total = days_in_month(month, final_be)
    if diff >= total:
        diff %= total
        month = next_month(month, final_be)
    return _WalkResult(month=month, day_number=diff)


@lru_cache(maxsize=512)
def be_year_transition(year: int) -> date:
    """Date of ១រោច ខែពិសាខ in ``year``: the day the Buddhist Era increments."""
    day = date(year, 4, 1)
    end = date(year, 6, 30)
    while day <= end:
        walked = _walk(day)
        if walked.month == LunarMonth.PISAKH and walked.day_number == 15:
            return day
        day += timedelta(days=1)
    return date(year, 4, 15)  # upstream fallback; not reached for 1900-2100


@dataclass(frozen=True)
class RawLunarDate:
    month: LunarMonth
    day_number: int
    be_year: int
    js_year: int
    animal_year: int
    sak: int


@lru_cache(maxsize=65536)
def gregorian_to_lunar(target: date, at: time = time(0, 0)) -> RawLunarDate:
    walked = _walk(target)
    moment = datetime.combine(target, at)
    transition = datetime.combine(be_year_transition(target.year), time(0, 0))

    be_year = target.year + 544 if moment >= transition else target.year + 543
    js_year = be_to_js(be_year)
    animal = (be_year + 4) % 12

    ny = new_year_info(target.year)
    # DEVIATION: upstream uses ``<=`` against the BE transition moment, which
    # double-increments the animal year and era at exactly 00:00 on ១រោច ពិសាខ
    # (when ``be_year`` has already advanced). We use a strict comparison.
    if ny.moha_songkran <= moment < transition:
        animal = (animal + 1) % 12
    if datetime.combine(ny.lerng_sak, time(0, 0)) <= moment < transition:
        js_year += 1

    return RawLunarDate(
        month=walked.month,
        day_number=walked.day_number,
        be_year=be_year,
        js_year=js_year,
        animal_year=animal,
        sak=js_year % 10,
    )
