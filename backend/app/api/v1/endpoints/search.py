from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import Holidays
from app.schemas import Page, SearchHit

router = APIRouter(tags=["search"])


@router.get(
    "/search",
    response_model=Page[SearchHit],
    summary="Search holidays, events, or an ISO date",
)
def search(
    service: Holidays,
    q: Annotated[str, Query(min_length=2, max_length=100, examples=["pchum", "2026-10-11"])],
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    offset: Annotated[int, Query(ge=0, le=10_000)] = 0,
) -> Page[SearchHit]:
    return service.search(q, limit, offset)
