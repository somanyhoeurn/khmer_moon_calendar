from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import Calendar
from app.schemas import CalendarMonthOut, CalendarYearOut, ErrorResponse, TodayOut

router = APIRouter(prefix="/calendar", tags=["calendar"])

YearParam = Annotated[int, Query(ge=1900, le=2100, examples=[2026], description="Gregorian year")]
_errors: dict[int | str, dict[str, object]] = {422: {"model": ErrorResponse}}


@router.get("/today", response_model=TodayOut, summary="Today's date in Asia/Phnom_Penh")
def today(service: Calendar) -> TodayOut:
    return service.today()


@router.get(
    "/month",
    response_model=CalendarMonthOut,
    responses=_errors,
    summary="Every day of a Gregorian month with lunar dates, holidays and events",
)
def month(
    service: Calendar,
    year: YearParam,
    month: Annotated[int, Query(ge=1, le=12, examples=[10])],
) -> CalendarMonthOut:
    return service.month(year, month)


@router.get(
    "/year",
    response_model=CalendarYearOut,
    responses=_errors,
    summary="A full Gregorian year grouped by month",
)
def year(service: Calendar, year: YearParam) -> CalendarYearOut:
    return service.year(year)
