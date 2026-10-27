"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import { DayDialog } from "@/components/calendar/day-dialog";
import { MonthAgenda } from "@/components/calendar/month-agenda";
import { MonthGrid } from "@/components/calendar/month-grid";
import { MonthYearPicker } from "@/components/calendar/month-year-picker";
import { ViewSwitch } from "@/components/calendar/view-switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/form-controls";
import { useCalendarMonth } from "@/lib/api/queries";
import { MAX_YEAR, MIN_YEAR, localizeNumber, monthName, monthOffset } from "@/lib/date/format";

export interface MonthCalendarProps {
  initialYear: number;
  initialMonth: number;
  todayIso: string;
  /** Pre-selected day (e.g. from `?day=` on the calendar page). */
  initialSelected?: string;
  /** Keep /calendar/{year}/{month}?day= in the address bar in sync (calendar page only). */
  syncUrl?: boolean;
}

export function MonthCalendar({
  initialYear,
  initialMonth,
  todayIso,
  initialSelected,
  syncUrl = false,
}: MonthCalendarProps) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const km = locale === "km";
  const [{ year, month }, setView] = useState({ year: initialYear, month: initialMonth });
  const [selected, setSelected] = useState<string | undefined>(initialSelected);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Clicking a date (in the grid or the month list) selects it and opens its details.
  const openDay = (date: string) => {
    setSelected(date);
    setDetailsOpen(true);
  };
  const query = useCalendarMonth(year, month);

  useEffect(() => {
    if (!syncUrl) return;
    // The query string keeps the selected day across reloads and language switches.
    const day = selected?.startsWith(`${year}-${String(month).padStart(2, "0")}`) ? `?day=${selected}` : "";
    window.history.replaceState(null, "", `/${locale}/calendar/${year}/${month}${day}`);
  }, [syncUrl, locale, year, month, selected]);

  const go = (next: { year: number; month: number }) => {
    if (next.year < MIN_YEAR || next.year > MAX_YEAR) return;
    setView(next);
    setSelected(undefined);
  };

  const goToday = () => {
    const [y, m] = todayIso.split("-").map(Number);
    go({ year: y ?? initialYear, month: m ?? initialMonth });
    setSelected(todayIso);
  };

  const data = query.data?.year === year && query.data.month === month ? query.data : undefined;
  const selectedDay = useMemo(() => {
    if (!data) return undefined;
    return data.days.find((d) => d.date === selected) ?? data.days.find((d) => d.is_today) ?? data.days[0];
  }, [data, selected]);

  const unique = (values: string[]) => Array.from(new Set(values)).join(" – ");
  const lunarMonths = data ? unique(data.days.map((d) => (km ? d.lunar.month.name_km : d.lunar.month.name_en))) : "";
  const beYears = data ? unique(data.days.map((d) => localizeNumber(d.lunar.be_year, locale))) : "";

  return (
    <section aria-labelledby="calendar-title" className="xl:flex xl:h-full xl:flex-col">
      {/* Compact toolbar: one row on desktop, wraps on small screens. */}
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 grow sm:grow-0">
          <h2 id="calendar-title" aria-live="polite" className="text-2xl font-semibold leading-tight text-forest lg:text-[1.75rem]">
            {/* The title opens the "choose month and year" dialog. */}
            <MonthYearPicker year={year} month={month} onSave={go}>
              <span>
                {monthName(month, locale)}{" "}
                <span lang={km ? "en" : "km"} className="font-medium text-muted">
                  {monthName(month, km ? "en" : "km")}
                </span>{" "}
                {localizeNumber(year, locale)}
              </span>
              <ChevronDown className="h-5 w-5 shrink-0 text-muted" aria-hidden />
            </MonthYearPicker>
          </h2>
          <p className="min-h-5 text-sm leading-snug text-gold-text">
            {data && (
              <>
                {t("lunarMonthsInView", { months: lunarMonths })}
                <span aria-hidden> · </span>
                {t("beYearShort", { year: beYears })}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="outline" onClick={goToday} className="h-9">
            {t("today")}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => go(monthOffset(year, month, -1))}
            disabled={year === MIN_YEAR && month === 1}
            aria-label={t("previousMonth")}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => go(monthOffset(year, month, 1))}
            disabled={year === MAX_YEAR && month === 12}
            aria-label={t("nextMonth")}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Button>
        </div>

        <div className="sm:ml-auto">
          <ViewSwitch year={year} month={month} active="month" />
        </div>
      </div>

      {/* Grid on the left, the month's holidays and observances on the right (stacked below on smaller screens). */}
      <div className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <div className="min-w-0 xl:flex xl:min-h-0 xl:flex-col">
          {query.isError && !data ? (
            <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface py-24 text-center">
              <p>{t("loadError")}</p>
              <Button onClick={() => query.refetch()}>{t("retry")}</Button>
            </div>
          ) : !data ? (
            <div role="status" aria-label={t("loading")} className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border">
              {Array.from({ length: 35 }, (_, i) => (
                <Skeleton key={i} className="h-[4.5rem] rounded-none sm:h-28 lg:h-36" />
              ))}
            </div>
          ) : (
            <div key={`${year}-${month}`} className="animate-fade-in xl:min-h-0 xl:flex-1">
              <MonthGrid
                year={year}
                fill
                month={month}
                days={data.days}
                holidays={data.holidays}
                events={data.events}
                locale={locale}
                selectedDate={selectedDay?.date}
                onSelect={openDay}
              />
            </div>
          )}
          <CalendarLegend className="mt-3 flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted" />
        </div>

        {/* On wide screens the agenda matches the grid's height and scrolls on its own. */}
        <div className="relative min-h-80 xl:min-h-0">
          <div className="xl:absolute xl:inset-0">
            {data ? (
              <MonthAgenda days={data.days} holidays={data.holidays} events={data.events} selectedDate={selectedDay?.date} onSelect={openDay} />
            ) : (
              <Skeleton className="h-full min-h-80 rounded-xl" />
            )}
          </div>
        </div>
      </div>
      {data && (
        <DayDialog day={selectedDay} holidays={data.holidays} events={data.events} open={detailsOpen} onOpenChange={setDetailsOpen} />
      )}
    </section>
  );
}
