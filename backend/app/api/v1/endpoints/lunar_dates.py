from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import Conversion
from app.domain.calendar.constants import MoonPhase
from app.schemas import ErrorResponse, LunarDateOut, LunarMonthId, ReverseConversionOut

router = APIRouter(prefix="/lunar-dates", tags=["lunar dates"])
_errors: dict[int | str, dict[str, object]] = {422: {"model": ErrorResponse}}


@router.get(
    "/convert",
    response_model=LunarDateOut,
    responses=_errors,
    summary="Convert a Gregorian date to a Khmer lunar date",
)
def convert(
    service: Conversion,
    date_: Annotated[date, Query(alias="date", examples=["2026-10-27"], description="ISO date")],
) -> LunarDateOut:
    return service.to_lunar(date_)


@router.get(
    "/reverse",
    response_model=ReverseConversionOut,
    responses=_errors,
    summary="Convert a Khmer lunar date to Gregorian date candidates",
    description=(
        "`year` is the Buddhist Era year, which increments on ១រោច ខែពិសាខ. In leap-month "
        "(adhikameas) years Asadh is replaced by `pathamasadh` and `tutiyasadh`. "
        "Every matching date is returned; `ambiguous` is true if there is more than one."
    ),
)
def reverse(
    service: Conversion,
    year: Annotated[int, Query(ge=2444, le=2644, examples=[2570], description="BE year")],
    month: Annotated[LunarMonthId, Query(examples=["assoch"])],
    day: Annotated[int, Query(ge=1, le=15, examples=[1])],
    phase: Annotated[MoonPhase, Query(examples=["waning"])],
) -> ReverseConversionOut:
    return service.to_gregorian(year, month, day, phase)
