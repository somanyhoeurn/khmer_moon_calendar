"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Skeleton } from "@/components/ui/form-controls";
import { useEvents, useHolidays } from "@/lib/api/queries";
import { isCoveredByHoliday } from "@/lib/calendar/observances";
import { MAX_YEAR, MIN_YEAR, formatRange, localizeNumber } from "@/lib/date/format";
import { Link } from "@/lib/i18n/navigation";

const CATEGORIES = ["national", "royal", "buddhist", "traditional", "international"] as const;

export function matches(text: string[], query: string): boolean {
  const q = query.trim().toLowerCase();
  return !q || text.some((t) => t.toLowerCase().includes(q));
}

export function HolidayDirectory({ initialYear }: { initialYear: number }) {
  const t = useTranslations("holidays");
  const tc = useTranslations("calendar");
  const locale = useLocale();
  const km = locale === "km";
  const [year, setYear] = useState(initialYear);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const holidays = useHolidays(year);
  const events = useEvents(year);

  const filteredHolidays = useMemo(
    () =>
      (holidays.data ?? []).filter(
        (h) => (!category || h.category === category) && matches([h.name_en, h.name_km, h.slug], query),
      ),
    [holidays.data, category, query],
  );
  const filteredEvents = useMemo(
    () =>
      (events.data ?? []).filter(
        (e) =>
          // A calculated observance already published as a holiday record is listed once, as the holiday.
          !isCoveredByHoliday(e, holidays.data ?? []) &&
          (!category || e.category === category) &&
          matches([e.title_en, e.title_km, e.slug], query),
      ),
    [events.data, holidays.data, category, query],
  );

  const years = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);
  const loading = holidays.isPending || events.isPending;
  const failed = holidays.isError || events.isError;

  return (
    <div className="space-y-6">
      <form role="search" className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]" onSubmit={(e) => e.preventDefault()}>
        <div>
          <Label htmlFor="holiday-search">{t("search")}</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" aria-hidden />
            <Input
              id="holiday-search"
              type="search"
              className="pl-9"
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="holiday-year">{t("year")}</Label>
          <Select id="holiday-year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {localizeNumber(y, locale)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="holiday-category">{t("category")}</Label>
          <Select id="holiday-category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t("all")}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`categories.${c}`)}
              </option>
            ))}
          </Select>
        </div>
      </form>

      {failed ? (
        <div role="alert" className="py-8 text-center">
          <p>{t("loadError")}</p>
          <Button
            className="mt-3"
            onClick={() => {
              void holidays.refetch();
              void events.refetch();
            }}
          >
            {tc("retry")}
          </Button>
        </div>
      ) : loading ? (
        <div role="status" aria-label={t("loading")} className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted" aria-live="polite">
            {t("results", { count: filteredHolidays.length + filteredEvents.length })}
          </p>
          <Card>
            <CardHeader>
              <CardTitle>{t("publicHolidays")}</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredHolidays.length === 0 ? (
                <p className="text-sm text-muted">
                  {holidays.data?.length ? t("empty") : t("noHolidayRecords", { year: localizeNumber(year, locale) })}
                </p>
              ) : (
                <ul className="divide-y divide-border" data-testid="holiday-list">
                  {filteredHolidays.map((h) => (
                    <li key={h.slug} className="flex flex-wrap items-start justify-between gap-2 py-3">
                      <div>
                        <Link href={`/holidays/${h.slug}`} className="font-medium hover:underline">
                          {km ? h.name_km : h.name_en}
                        </Link>
                        <p className="text-sm text-muted" lang={km ? "en" : "km"}>
                          {km ? h.name_en : h.name_km}
                        </p>
                        <p className="text-sm">{formatRange(h.start_date, h.end_date, locale)}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="holiday">{t(`categories.${h.category}`)}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("observances")}</CardTitle>
              <p className="text-sm text-muted">{t("observancesNote")}</p>
            </CardHeader>
            <CardContent>
              {filteredEvents.length === 0 ? (
                <p className="text-sm text-muted">{t("empty")}</p>
              ) : (
                <ul className="divide-y divide-border" data-testid="event-list">
                  {filteredEvents.map((e) => (
                    <li key={e.slug} className="flex flex-wrap items-start justify-between gap-2 py-3">
                      <div>
                        <p className="font-medium">{km ? e.title_km : e.title_en}</p>
                        <p className="text-sm">{formatRange(e.start_date, e.end_date, locale)}</p>
                        {e.anchor_lunar_date_km && (
                          <p className="text-sm text-muted">
                            {t("lunarDate")}: {km ? e.anchor_lunar_date_km : e.anchor_lunar_date_en}
                          </p>
                        )}
                      </div>
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
