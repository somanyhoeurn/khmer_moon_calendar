"""Month and year calendar views assembled from lunar dates, holidays and events."""

from __future__ import annotations

import calendar
from collections.abc import Callable
from datetime import date, datetime

from app.schemas import CalendarDayOut, CalendarMonthOut, CalendarYearOut, TodayOut
from app.services.holiday_service import HolidayService
from app.services.lunar_date_service import LunarDateService


class CalendarService:
    def __init__(
        self,
        lunar_dates: LunarDateService,
        holidays: HolidayService,
        now: Callable[[], datetime],
        timezone_name: str,
    ) -> None:
        self.lunar_dates = lunar_dates
        self.holidays = holidays
        self.now = now
        self.timezone_name = timezone_name

    def today(self) -> TodayOut:
        now = self.now()
        return TodayOut(timezone=self.timezone_name, now=now, date=self.lunar_dates.get(now.date()))

    def month(self, year: int, month: int) -> CalendarMonthOut:
        start = date(year, month, 1)
        end = date(year, month, calendar.monthrange(year, month)[1])
        today = self.now().date()
        lunar = self.lunar_dates.get_range(start, end)
        holidays = self.holidays.holidays_in_range(start, end)
        events = self.holidays.events_in_range(start, end)

        days = [
            CalendarDayOut(
                date=item.gregorian_date,
                is_today=item.gregorian_date == today,
                is_weekend=item.gregorian_date.weekday() >= 5,
                lunar=item,
                holidays=[h.slug for h in holidays if h.start_date <= item.gregorian_date <= h.end_date],
                events=[e.slug for e in events if e.start_date <= item.gregorian_date <= e.end_date],
            )
            for item in lunar
        ]
        return CalendarMonthOut(year=year, month=month, days=days, holidays=holidays, events=events)

    def year(self, year: int) -> CalendarYearOut:
        return CalendarYearOut(year=year, months=[self.month(year, m) for m in range(1, 13)])
