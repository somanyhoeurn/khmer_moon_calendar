from __future__ import annotations

from fastapi import APIRouter, Response

from app import __version__
from app.api.deps import AppSettings, DbSession, Engine
from app.db.session import check_database
from app.schemas import HealthOut

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut, summary="Application and database health")
def health(db: DbSession, settings: AppSettings, engine: Engine, response: Response) -> HealthOut:
    db_ok = check_database(db)
    if not db_ok:
        response.status_code = 503
    return HealthOut(
        status="ok" if db_ok else "degraded",
        app=settings.app_name,
        version=__version__,
        environment=settings.environment,
        database="ok" if db_ok else "unavailable",
        calendar_engine=f"{engine.name}@{engine.version}",
    )
