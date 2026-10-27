"""Reconcile calculated lunar dates with published reference records.

Calculations are never authoritative on their own. For every date the service
reports one of:

* ``calculated``  – no reference record exists; the engine output is shown as-is.
* ``verified``    – a reference record exists and agrees with the engine.
* ``overridden``  – a reference record disagrees; the record wins and the
  discrepancy is surfaced so it can be investigated.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import date
from enum import StrEnum

from app.domain.calendar.constants import LunarMonth, MoonPhase
from app.domain.calendar.types import KhmerLunarDate


class DateVerification(StrEnum):
    CALCULATED = "calculated"
    VERIFIED = "verified"
    OVERRIDDEN = "overridden"


@dataclass(frozen=True)
class ReferenceLunarDate:
    """A lunar date published by an identified source."""

    gregorian_date: date
    month: LunarMonth
    day: int
    phase: MoonPhase
    source_name: str
    source_url: str | None
    verification_status: str  # mirrors models.enums.VerificationStatus


@dataclass(frozen=True)
class ValidatedLunarDate:
    lunar: KhmerLunarDate
    verification: DateVerification
    reference: ReferenceLunarDate | None = None
    calculated: KhmerLunarDate | None = None  # engine output when overridden


class CalendarValidationService:
    def validate(self, lunar: KhmerLunarDate, reference: ReferenceLunarDate | None) -> ValidatedLunarDate:
        if reference is None:
            return ValidatedLunarDate(lunar=lunar, verification=DateVerification.CALCULATED)

        agrees = (lunar.month, lunar.day, lunar.phase) == (
            reference.month,
            reference.day,
            reference.phase,
        )
        if agrees:
            return ValidatedLunarDate(
                lunar=lunar, verification=DateVerification.VERIFIED, reference=reference
            )

        waxing = reference.phase is MoonPhase.WAXING
        corrected = replace(
            lunar,
            month=reference.month,
            day=reference.day,
            phase=reference.phase,
            day_of_month=reference.day if waxing else reference.day + 15,
        )
        return ValidatedLunarDate(
            lunar=corrected,
            verification=DateVerification.OVERRIDDEN,
            reference=reference,
            calculated=lunar,
        )
