"use client";

import { useLocale, useTranslations } from "next-intl";
import { BuddhaLogo } from "@/components/branding/buddha-logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { dayMarkers, recordTitle } from "@/lib/calendar/observances";
import { WEEKDAYS_LONG_KM, WEEKDAYS_SHORT_EN, localizeNumber } from "@/lib/date/format";
import { cn } from "@/lib/utils/cn";
import type { CalendarDay, CalendarEvent, Holiday } from "@/types/api";

type Tone = "holiday" | "buddhist" | "other";

interface AgendaItem {
  key: string;
  tone: Tone;
  title: string;
}

/** Chronological list of every holiday and observance in the visible month, beside the grid. */
export function MonthAgenda({
  days,
  holidays,
  events,
  selectedDate,
  onSelect,
}: {
  days: CalendarDay[];
  holidays: Holiday[];
  events: CalendarEvent[];
  selectedDate?: string;
  onSelect: (date: string) => void;
}) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const km = locale === "km";
  const rows = days
    .map((day) => {
      const markers = dayMarkers(day, holidays, events);
      const items: AgendaItem[] = [
        ...markers.publicHolidays.map((r) => ({ key: r.slug, tone: "holiday" as const, title: recordTitle(r, locale) })),
        ...markers.buddhist.map((r) => ({ key: r.slug, tone: "buddhist" as const, title: recordTitle(r, locale) })),
        ...markers.other.map((r) => ({ key: r.slug, tone: "other" as const, title: recordTitle(r, locale) })),
      ];
      return { day, items };
    })
    .filter((row) => row.items.length > 0);

  return (
    <section aria-labelledby="agenda-heading" className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <h2 id="agenda-heading" className="border-b border-border bg-surface-muted/70 px-4 py-2 text-sm font-semibold text-forest">
        {t("agendaTitle")}
      </h2>

      <ScrollArea className="min-h-0 flex-1">
        <ol className="divide-y divide-border p-2">
          {rows.map(({ day, items }) => {
            const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
            const selected = day.date === selectedDate;
            const isHoliday = items.some((item) => item.tone === "holiday");
            return (
              <li key={day.date}>
                <button
                  type="button"
                  onClick={() => onSelect(day.date)}
                  aria-pressed={selected}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-surface-muted"
                >
                  <span className="flex w-14 shrink-0 flex-col items-center justify-center leading-tight">
                    {/* Public holidays: the date is red like the holiday name. */}
                    <span className={cn("text-[11px]", isHoliday ? "text-holiday" : "text-muted")}>
                      {km ? WEEKDAYS_LONG_KM[weekday] : WEEKDAYS_SHORT_EN[weekday]}
                    </span>
                    {/* Today: a true circle around the day number. */}
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold",
                        day.is_today ? "bg-primary text-primary-foreground" : isHoliday ? "text-holiday" : "text-forest",
                      )}
                    >
                      {localizeNumber(Number(day.date.slice(8)), locale)}
                    </span>
                  </span>
                  {/* One block per record, each with a coloured edge so several on a day stay distinct. */}
                  <span className="flex min-w-0 grow flex-col justify-center gap-2">
                    {items.map((item) => (
                      <span
                        key={item.key}
                        className={cn(
                          "flex items-start gap-1.5 border-l-2 pl-2",
                          item.tone === "holiday" && "border-holiday text-holiday",
                          item.tone === "buddhist" && "border-gold text-gold-text",
                          item.tone === "other" && "border-event text-event",
                        )}
                      >
                        {item.tone === "buddhist" && <BuddhaLogo variant="mark" className="mt-0.5 h-4 w-4 shrink-0" />}
                        <span className="min-w-0 text-sm font-medium">{item.title}</span>
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
          {rows.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted">{t("agendaEmpty")}</li>}
        </ol>
      </ScrollArea>
    </section>
  );
}
