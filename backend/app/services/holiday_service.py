"""Holidays (sourced records) and events (records + calculated observances)."""

from __future__ import annotations

from datetime import date, timedelta

from app.core.exceptions import NotFoundError
from app.db.repositories import CalendarEventRepository, HolidayRepository
from app.domain.calendar.engine import ChhankitekEngine
from app.domain.calendar.formatting import format_lunar_short_en, format_lunar_short_km
from app.domain.holidays.rules import (
    CHINESE_NEW_YEAR,
    CHINESE_NEW_YEAR_DAYS,
    fixed_date_occurrences,
    is_expected_public_holiday,
    occurrences_in_year,
)
from app.models import CalendarEvent, CalendarSource, Holiday
from app.schemas import EventOut, HolidayOut, Page, SearchHit, SourceOut

ALGORITHM_SOURCE = SourceOut(
    name="Chhankitek calculation (MomentKH port)",
    source_url="https://github.com/ThyrithSor/momentkh",
    source_type="algorithm",
)


def _source(source: CalendarSource | None) -> SourceOut | None:
    if source is None:
        return None
    return SourceOut(
        name=source.name,
        source_url=source.source_url,
        source_type=str(source.source_type),
        publication_year=source.publication_year,
    )


def holiday_out(row: Holiday) -> HolidayOut:
    return HolidayOut(
        slug=row.slug,
        name_km=row.name_km,
        name_en=row.name_en,
        description_km=row.description_km,
        description_en=row.description_en,
        start_date=row.start_date,
        end_date=row.end_date,
        category=str(row.category),
        holiday_type=str(row.holiday_type),
        is_official_public_holiday=row.is_official_public_holiday,
        lunar_rule=row.lunar_rule,
        verification_status=str(row.verification_status),
        source=_source(row.source),
        updated_at=row.updated_at,
    )


def _event_out(row: CalendarEvent) -> EventOut:
    return EventOut(
        slug=row.slug,
        title_km=row.title_km,
        title_en=row.title_en,
        description_km=row.description_km,
        description_en=row.description_en,
        event_type=str(row.event_type),
        category="cultural",
        start_date=row.start_date,
        end_date=row.end_date or row.start_date,
        origin="database",
        verification_status=str(row.verification_status),
        source=_source(row.source),
    )


class HolidayService:
    def __init__(
        self,
        engine: ChhankitekEngine,
        holidays: HolidayRepository,
        events: CalendarEventRepository,
    ) -> None:
        self.engine = engine
        self.holidays = holidays
        self.events = events

    # -- holidays -----------------------------------------------------------

    def holidays_for_year(self, year: int, category: str | None = None) -> list[HolidayOut]:
        rows = self.holidays.in_range(date(year, 1, 1), date(year, 12, 31), category)
        return [holiday_out(r) for r in rows]

    def holidays_in_range(self, start: date, end: date) -> list[HolidayOut]:
        return [holiday_out(r) for r in self.holidays.in_range(start, end)]

    def holiday(self, slug: str) -> HolidayOut:
        row = self.holidays.by_slug(slug)
        if row is None:
            raise NotFoundError(f"Holiday '{slug}' was not found")
        return holiday_out(row)

    # -- events -------------------------------------------------------------

    def calculated_observances(self, year: int) -> list[EventOut]:
        out: list[EventOut] = []
        for occ in occurrences_in_year(self.engine, year):
            anchor = self.engine.to_lunar(occ.anchor_date)
            out.append(
                EventOut(
                    slug=occ.slug,
                    expected_public_holiday=is_expected_public_holiday(occ.rule.key, year),
                    title_km=occ.rule.title_km,
                    title_en=occ.rule.title_en,
                    description_km=occ.rule.description_km,
                    description_en=occ.rule.description_en,
                    event_type="buddhist_observance" if occ.rule.category == "buddhist" else "festival",
                    category=occ.rule.category,
                    start_date=occ.start_date,
                    end_date=occ.end_date,
                    anchor_lunar_date_km=format_lunar_short_km(anchor),
                    anchor_lunar_date_en=format_lunar_short_en(anchor),
                    origin="lunar_rule",
                    verification_status="calculated",
                    source=ALGORITHM_SOURCE,
                )
            )
        for fixed in fixed_date_occurrences(year):
            out.append(
                EventOut(
                    slug=fixed.slug,
                    expected_public_holiday=is_expected_public_holiday(fixed.rule.key, year),
                    title_km=fixed.rule.title_km,
                    title_en=fixed.rule.title_en,
                    event_type="commemoration",
                    category=fixed.rule.category,
                    start_date=fixed.day,
                    end_date=fixed.day,
                    origin="date_rule",
                    verification_status="calculated",
                )
            )
        if (cny := CHINESE_NEW_YEAR.get(year)) is not None:
            out += [
                EventOut(
                    slug=f"chinese-new-years-eve-{year}",
                    title_km="ថ្ងៃសែនចូលឆ្នាំចិន",
                    title_en="Chinese New Year's Eve",
                    event_type="festival",
                    category="cultural",
                    start_date=cny - timedelta(days=1),
                    end_date=cny - timedelta(days=1),
                    origin="date_rule",
                    verification_status="calculated",
                ),
                EventOut(
                    slug=f"chinese-new-year-{year}",
                    title_km="ចូលឆ្នាំចិន",
                    title_en="Chinese New Year",
                    description_km="ថ្ងៃចូលឆ្នាំតាមប្រតិទិនចន្ទគតិចិន។",
                    description_en="New Year of the Chinese lunisolar calendar.",
                    event_type="festival",
                    category="cultural",
                    start_date=cny,
                    end_date=cny + timedelta(days=CHINESE_NEW_YEAR_DAYS - 1),
                    origin="date_rule",
                    verification_status="calculated",
                ),
            ]
        ny = self.engine.khmer_new_year(year)
        start = ny.moha_songkran.date()
        out.append(
            EventOut(
                slug=f"khmer-new-year-songkran-{year}",
                expected_public_holiday=is_expected_public_holiday("khmer-new-year-songkran", year),
                title_km="មហាសង្ក្រាន្ត ចូលឆ្នាំខ្មែរ",
                title_en="Khmer New Year (Moha Songkran, calculated)",
                description_km=f"ពេលវេលាទេវតាចុះគណនា៖ {ny.moha_songkran:%H:%M}។ ថ្ងៃឈប់សម្រាកផ្លូវការកំណត់ដោយអនុក្រឹត្យ។",
                description_en=(
                    f"Calculated Moha Songkran moment {ny.moha_songkran:%H:%M}; "
                    "official holidays are set by sub-decree."
                ),
                event_type="festival",
                category="traditional",
                start_date=start,
                end_date=start + timedelta(days=ny.number_of_days - 1),
                origin="songkran_calculation",
                verification_status="calculated",
                source=ALGORITHM_SOURCE,
            )
        )
        return sorted(out, key=lambda e: e.start_date)

    def events_in_range(self, start: date, end: date) -> list[EventOut]:
        stored = [_event_out(r) for r in self.events.in_range(start, end)]
        calculated = [
            e
            for year in range(start.year, end.year + 1)
            for e in self.calculated_observances(year)
            if e.start_date <= end and e.end_date >= start
        ]
        return sorted(stored + calculated, key=lambda e: (e.start_date, e.slug))

    # -- search -------------------------------------------------------------

    def search(self, q: str, limit: int, offset: int) -> Page[SearchHit]:
        hits: list[SearchHit] = []
        try:
            as_date = date.fromisoformat(q.strip())
        except ValueError:
            as_date = None
        if as_date and self.engine.min_date <= as_date <= self.engine.max_date:
            lunar = self.engine.to_lunar(as_date)
            hits.append(
                SearchHit(
                    kind="date",
                    title_km=format_lunar_short_km(lunar),
                    title_en=format_lunar_short_en(lunar),
                    start_date=as_date,
                    verification_status="calculated",
                )
            )

        holidays, h_total = self.holidays.search(q, limit, offset)
        events, e_total = self.events.search(q, limit, offset)
        hits += [
            SearchHit(
                kind="holiday",
                slug=h.slug,
                title_km=h.name_km,
                title_en=h.name_en,
                start_date=h.start_date,
                end_date=h.end_date,
                verification_status=str(h.verification_status),
            )
            for h in holidays
        ]
        hits += [
            SearchHit(
                kind="event",
                slug=e.slug,
                title_km=e.title_km,
                title_en=e.title_en,
                start_date=e.start_date,
                end_date=e.end_date,
                verification_status=str(e.verification_status),
            )
            for e in events
        ]
        total = h_total + e_total + (1 if as_date else 0)
        return Page[SearchHit](items=hits[:limit], total=total, limit=limit, offset=offset)
