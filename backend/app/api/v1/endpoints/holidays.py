from __future__ import annotations

import calendar
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Path, Query

from app.api.deps import Holidays
from app.models.enums import HolidayCategory
from app.schemas import ErrorResponse, EventOut, HolidayOut

router = APIRouter(tags=["holidays & events"])
YearParam = Annotated[int, Query(ge=1900, le=2100, examples=[2026])]


@router.get(
    "/holidays",
    response_model=list[HolidayOut],
    summary="Sourced holiday records for a year",
    description="Only records backed by a documented source. Lunar-rule observances are under /events.",
)
def list_holidays(
    service: Holidays,
    year: YearParam,
    category: Annotated[HolidayCategory | None, Query()] = None,
) -> list[HolidayOut]:
    return service.holidays_for_year(year, category.value if category else None)


@router.get(
    "/holidays/{slug}",
    response_model=HolidayOut,
    responses={404: {"model": ErrorResponse}},
    summary="Holiday detail",
)
def get_holiday(service: Holidays, slug: Annotated[str, Path(pattern=r"^[a-z0-9-]{1,160}$")]) -> HolidayOut:
    return service.holiday(slug)


@router.get(
    "/events",
    response_model=list[EventOut],
    summary="Cultural and religious events in a year or month",
    description="Combines stored events with calculated lunar-rule observances (status `calculated`).",
)
def list_events(
    service: Holidays,
    year: YearParam,
    month: Annotated[int | None, Query(ge=1, le=12, examples=[10])] = None,
) -> list[EventOut]:
    if month is None:
        start, end = date(year, 1, 1), date(year, 12, 31)
    else:
        start = date(year, month, 1)
        end = date(year, month, calendar.monthrange(year, month)[1])
    return service.events_in_range(start, end)
