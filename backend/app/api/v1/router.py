from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import calendar, health, holidays, lunar_dates, search

api_v1_router = APIRouter(prefix="/v1")
for module in (health, calendar, lunar_dates, holidays, search):
    api_v1_router.include_router(module.router)
