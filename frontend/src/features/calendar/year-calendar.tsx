"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import { MonthGrid } from "@/components/calendar/month-grid";
import { ViewSwitch } from "@/components/calendar/view-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/form-controls";
import { useCalendarYear } from "@/lib/api/queries";
import { isCoveredByHoliday } from "@/lib/calendar/observances";
import { MAX_YEAR, MIN_YEAR, formatRange, localizeNumber, monthName } from "@/lib/date/format";
import { Link, useRouter } from "@/lib/i18n/navigation";

export function YearCalendar({ year, currentMonth = 1 }: { year: number; currentMonth?: number }) {
  const t = useTranslations("calendar");
  const th = useTranslations("holidays");
  const locale = useLocale();
  const km = locale === "km";
  const router = useRouter();
  const query = useCalendarYear(year);

  const holidays = query.data
    ? Array.from(new Map(query.data.months.flatMap((m) => m.holidays).map((h) => [h.slug, h])).values())
    : [];
  const beYears = query.data
    ? Array.from(new Set(query.data.months.flatMap((m) => m.days.map((d) => localizeNumber(d.lunar.be_year, locale))))).join(" – ")
    : "";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="icon" aria-label={t("previousYear")}>
              <Link href={`/calendar/${Math.max(MIN_YEAR, year - 1)}`}>
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </Link>
            </Button>
            <div className="min-w-28 text-center">
              <h1 className="text-3xl font-semibold leading-tight text-forest">{localizeNumber(year, locale)}</h1>
              <p className="min-h-5 text-sm text-gold-text">{beYears && t("beYearShort", { year: beYears })}</p>
            </div>
            <Button asChild variant="outline" size="icon" aria-label={t("nextYear")}>
              <Link href={`/calendar/${Math.min(MAX_YEAR, year + 1)}`}>
                <ChevronRight className="h-5 w-5" aria-hidden />
              </Link>
            </Button>
          </div>
          <ViewSwitch year={year} month={currentMonth} active="year" />
        </div>
        <CalendarLegend className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted" />
      </section>

      {query.isError ? (
        <div role="alert" className="rounded-2xl border border-border bg-surface py-12 text-center">
          <p>{t("loadError")}</p>
          <Button className="mt-3" onClick={() => query.refetch()}>
            {t("retry")}
          </Button>
        </div>
      ) : !query.data ? (
        <div role="status" aria-label={t("loading")} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid animate-fade-in gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {query.data.months.map((m) => {
              const lunarMonths = Array.from(new Set(m.days.map((d) => (km ? d.lunar.month.name_km : d.lunar.month.name_en)))).join(" – ");
              // Sourced public holidays plus rule-based expected ones not already covered by a sourced record.
              const holidayCount =
                m.holidays.filter((h) => h.is_official_public_holiday).length +
                m.events.filter((e) => e.expected_public_holiday && !isCoveredByHoliday(e, m.holidays)).length;
              return (
                <Card key={m.month} className="overflow-hidden">
                  <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
                    <div className="min-w-0">
                      <CardTitle as="h2" className="text-lg">
                        <Link href={`/calendar/${year}/${m.month}`} className="hover:underline">
                          {monthName(m.month, locale)}
                        </Link>
                      </CardTitle>
                      <p className="truncate text-xs text-gold-text">{lunarMonths}</p>
                    </div>
                    {holidayCount > 0 && (
                      <span className="shrink-0 rounded-full bg-holiday-soft px-2 py-0.5 text-xs text-holiday">
                        {t("holidayCount", { count: holidayCount, n: localizeNumber(holidayCount, locale) })}
                      </span>
                    )}
                  </CardHeader>
                  <CardContent className="px-3 pb-3 pt-0">
                    <MonthGrid
                      year={year}
                      month={m.month}
                      days={m.days}
                      holidays={m.holidays}
                      events={m.events}
                      locale={locale}
                      compact
                      onSelect={(date) => router.push(`/calendar/${year}/${m.month}?day=${date}`)}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{th("publicHolidays")}</CardTitle>
            </CardHeader>
            <CardContent>
              {holidays.length === 0 ? (
                <p className="text-sm text-muted">{th("noHolidayRecords", { year: localizeNumber(year, locale) })}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {holidays.map((h) => (
                    <li key={h.slug} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <span className="flex items-center gap-2">
                        <span aria-hidden className="h-2 w-2 rounded-full bg-holiday" />
                        <Link href={`/holidays/${h.slug}`} className="font-medium hover:underline">
                          {km ? h.name_km : h.name_en}
                        </Link>
                      </span>
                      <span className="text-sm text-muted">{formatRange(h.start_date, h.end_date, locale)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
