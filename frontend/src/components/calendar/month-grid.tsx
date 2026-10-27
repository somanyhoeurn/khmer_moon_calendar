"use client";

import { useTranslations } from "next-intl";
import { type CSSProperties, type KeyboardEvent, useRef } from "react";
import { BuddhaLogo } from "@/components/branding/buddha-logo";
import { MoonPhaseIcon } from "@/components/lunar-date/moon-phase-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type DayMarkers, dayMarkers, recordTitle } from "@/lib/calendar/observances";
import {
  WEEKDAYS_LONG_EN,
  WEEKDAYS_LONG_KM,
  WEEKDAYS_SHORT_EN,
  WEEKDAYS_SHORT_KM,
  formatGregorian,
  localizeNumber,
  lunarLong,
  lunarShort,
  monthName,
  phaseName,
} from "@/lib/date/format";
import { cn } from "@/lib/utils/cn";
import type { CalendarDay, CalendarEvent, Holiday } from "@/types/api";

export interface MonthGridProps {
  year: number;
  month: number;
  days: CalendarDay[];
  locale: string;
  /** Records referenced by `days[].holidays` / `days[].events`; used for labels and indicators. */
  holidays?: Holiday[];
  events?: CalendarEvent[];
  selectedDate?: string;
  onSelect?: (date: string) => void;
  /** Small cells for the year view: day number and indicators only. */
  compact?: boolean;
  /** Desktop (xl): stretch to the parent's height, sharing it equally between the weeks. */
  fill?: boolean;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

type Cell = { kind: "day"; day: CalendarDay } | { kind: "adjacent"; label: number };

/*
 * Full-size cells with room for the date, lunar day, a named lunar day and two event labels.
 * Rows keep this height and the page scrolls, rather than squeezing the month into the viewport.
 */
const FULL_CELL = "min-h-[4.5rem] sm:min-h-28 lg:min-h-36";

/** Sunday-first month grid. Arrow keys move between days; Enter/Space selects. */
export function MonthGrid({
  year,
  month,
  days,
  locale,
  holidays = [],
  events = [],
  selectedDate,
  onSelect,
  compact = false,
  fill = false,
}: MonthGridProps) {
  const t = useTranslations("calendar");
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const km = locale === "km";
  const shortNames = km ? WEEKDAYS_SHORT_KM : WEEKDAYS_SHORT_EN;
  const longNames = km ? WEEKDAYS_LONG_KM : WEEKDAYS_LONG_EN;

  const first = days[0];
  const leading = first ? new Date(`${first.date}T00:00:00Z`).getUTCDay() : 0;
  const previousMonthLength = daysInMonth(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1);
  // Adjacent-month days are shown as muted Gregorian numbers only; they are not part of this month's data.
  const cells: Cell[] = [
    ...Array.from({ length: leading }, (_, i): Cell => ({ kind: "adjacent", label: previousMonthLength - leading + i + 1 })),
    ...days.map((day): Cell => ({ kind: "day", day })),
  ];
  for (let next = 1; cells.length % 7 !== 0; next++) cells.push({ kind: "adjacent", label: next });
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const focusIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(days.length - 1, index));
    buttons.current[clamped]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key in moves) {
      event.preventDefault();
      focusIndex(index + (moves[event.key] ?? 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      focusIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusIndex(days.length - 1);
    }
  };

  const tabTarget = selectedDate ?? days.find((d) => d.is_today)?.date ?? first?.date;

  const monthLabel = (day: CalendarDay) => (km ? `ខែ${day.lunar.month.name_km}` : day.lunar.month.name_en);
  // Moon days come from the backend's flags; nothing is computed here.
  const lunarNote = (day: CalendarDay) =>
    day.lunar.is_full_moon
      ? t("fullMoon")
      : day.lunar.is_new_moon
        ? t("newMoon")
        : day.lunar.is_shaving_day
          ? t("shavingDay")
          : day.lunar.day_of_month === 1
          ? monthLabel(day)
          : undefined;

  const describe = (day: CalendarDay, markers: DayMarkers) =>
    [
      t("dayCellLabel", { gregorian: formatGregorian(day.date, locale), lunar: lunarShort(day.lunar, locale) }),
      day.is_today && t("todayLabel"),
      day.lunar.is_full_moon && t("fullMoon"),
      day.lunar.is_new_moon && t("newMoon"),
      ...markers.publicHolidays.map((h) => `${t("holiday")}: ${recordTitle(h, locale)}`),
      ...markers.buddhist.map((r) => `${t("buddhistObservance")}: ${recordTitle(r, locale)}`),
      ...markers.other.map((r) => recordTitle(r, locale)),
      markers.isPreceptDay && t("silaDay"),
    ]
      .filter(Boolean)
      .join(", ");

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-surface", fill && "xl:h-full")}>
      <table
        className={cn("w-full table-fixed border-collapse", fill && "xl:h-full")}
        // Each week gets an equal share of the height left under the 2.25rem weekday row.
        style={fill ? ({ "--week-height": `calc((100% - 2.25rem) / ${weeks.length})` } as CSSProperties) : undefined}
        aria-label={t("gridLabel", { month: monthName(month, locale), year: localizeNumber(year, locale) })}
      >
        <thead>
          <tr className="h-9 border-b border-border bg-surface-muted/70">
            {shortNames.map((name, i) => (
              <th
                key={name}
                scope="col"
                abbr={longNames[i]}
                className={cn(
                  "font-semibold text-muted",
                  compact ? "py-1 text-[11px]" : "px-2 py-2 text-xs sm:text-sm lg:text-left lg:px-3",
                  (i === 0 || i === 6) && "text-holiday",
                )}
              >
                {compact ? (
                  name
                ) : (
                  <>
                    <span className="lg:hidden">{name}</span>
                    <span className="hidden lg:inline">{longNames[i]}</span>
                  </>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w} className={fill ? "xl:h-(--week-height)" : undefined}>
              {week.map((cell, d) => {
                // h-px on the cell lets the button (h-full) stretch to the full row height, so today's and
                // holiday backgrounds fill the cell even when a neighbouring cell makes the row taller.
                const edge = cn(
                  "h-px border-border p-0 align-top",
                  w > 0 && "border-t",
                  d > 0 && "border-l",
                  // Fill mode: cell content no longer sets the row height, so the weeks share the space equally.
                  fill && "xl:relative",
                );
                if (cell.kind === "adjacent") {
                  return (
                    <td key={`adj-${w}-${d}`} className={cn(edge, "bg-surface-muted/40")}>
                      <span
                        aria-hidden
                        className={cn(
                          "block text-muted/60",
                          fill && "xl:absolute xl:inset-0",
                          compact ? "p-1 text-center text-[11px]" : "p-1.5 text-base sm:p-2 lg:p-2.5 lg:text-xl",
                        )}
                      >
                        {localizeNumber(cell.label, locale)}
                      </span>
                    </td>
                  );
                }

                const { day } = cell;
                const index = days.indexOf(day);
                const markers = dayMarkers(day, holidays, events);
                const isHoliday = markers.publicHolidays.length > 0;
                const isBuddhist = markers.buddhist.length > 0;
                const selected = day.date === selectedDate;
                const isWeekend = d === 0 || d === 6;
                const labels = [
                  ...markers.publicHolidays.map((h) => ({ key: h.slug, tone: "holiday" as const, text: recordTitle(h, locale) })),
                  ...markers.buddhist.map((r) => ({ key: r.slug, tone: "buddhist" as const, text: recordTitle(r, locale) })),
                  ...markers.other.map((r) => ({ key: r.slug, tone: "other" as const, text: recordTitle(r, locale) })),
                ];
                const label = describe(day, markers);

                return (
                  <td key={day.date} className={edge}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          ref={(el) => {
                            buttons.current[index] = el;
                          }}
                          type="button"
                          data-date={day.date}
                          tabIndex={day.date === tabTarget ? 0 : -1}
                          aria-pressed={selected}
                          aria-current={day.is_today ? "date" : undefined}
                          aria-label={label}
                          onClick={() => onSelect?.(day.date)}
                          onKeyDown={(e) => onKeyDown(e, index)}
                          className={cn(
                            "relative flex h-full w-full cursor-pointer flex-col overflow-hidden text-left transition-colors",
                            fill && "xl:absolute xl:inset-0 xl:min-h-0",
                            "outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                            compact ? "min-h-10 items-center p-1" : cn(FULL_CELL, "gap-0.5 p-1.5 sm:p-2 lg:p-2.5"),
                            "bg-surface hover:bg-surface-muted",
                            isBuddhist && "bg-gold-soft hover:bg-gold-soft/70",
                            isHoliday && "bg-holiday-soft hover:bg-holiday-soft/70",
                            day.is_today && "bg-sage hover:bg-sage/80",
                            selected && "z-1 ring-2 ring-inset ring-forest",
                          )}
                        >
                          {/* Semantic edge accents: emerald for today, coral for holidays, gold for Buddhist days. */}
                          {!compact && (day.is_today || isHoliday || isBuddhist) && (
                            <span
                              aria-hidden
                              className={cn(
                                "absolute inset-x-0 top-0 h-0.5",
                                day.is_today ? "bg-primary" : isHoliday ? "bg-holiday/70" : "bg-gold",
                              )}
                            />
                          )}

                          <span className={cn("flex w-full items-start justify-between gap-1", compact && "justify-center")}>
                            <span
                              className={cn(
                                "inline-flex items-center justify-center rounded-full font-semibold leading-none tabular-nums",
                                compact
                                  ? "h-6 w-6 text-xs"
                                  : "h-8 w-8 text-base sm:h-9 sm:w-9 sm:text-lg lg:h-11 lg:w-11 lg:text-2xl",
                                day.is_today ? "bg-primary text-primary-foreground" : "text-forest",
                                !day.is_today && (isHoliday || isWeekend) && "text-holiday",
                              )}
                            >
                              {localizeNumber(Number(day.date.slice(8)), locale)}
                            </span>
                            {!compact && (
                              <span className="mt-1 flex items-center gap-1">
                                {markers.isPreceptDay && <BuddhaLogo variant="mark" className="hidden h-5 w-5 text-gold-text sm:block" />}
                                <MoonPhaseIcon lunar={day.lunar} className="hidden sm:block sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                              </span>
                            )}
                          </span>

                          {!compact && (
                            <span className="flex items-center gap-0.5 text-xs leading-snug text-muted sm:block sm:text-sm lg:text-[15px]">
                              {/* Narrow cells: the moon glyph sits beside the lunar day and stands in for the phase word. */}
                              <MoonPhaseIcon lunar={day.lunar} className="h-2.5 w-2.5 sm:hidden" />
                              {localizeNumber(day.lunar.lunar_day, locale)}
                              <span className="hidden sm:inline"> {phaseName(day.lunar, locale)}</span>
                            </span>
                          )}
                          {/* Named lunar days, as on printed Khmer calendars: full moon, new moon, first day of the month. */}
                          {!compact && lunarNote(day) && (
                            <span className="hidden text-xs font-medium leading-snug text-gold-text sm:block lg:text-sm">{lunarNote(day)}</span>
                          )}

                          {compact ? (
                            (isHoliday || isBuddhist || markers.isPreceptDay) && (
                              <span aria-hidden className="mt-0.5 flex gap-0.5">
                                {isHoliday && <span className="h-1 w-1 rounded-full bg-holiday" />}
                                {(isBuddhist || markers.isPreceptDay) && <span className="h-1 w-1 rounded-full bg-gold" />}
                              </span>
                            )
                          ) : (
                            labels.length > 0 && (
                              <span aria-hidden className="mt-auto flex w-full min-w-0 flex-col gap-0.5 pt-1">
                                {/* Mobile: icons only; the details appear below the calendar on selection. */}
                                <span className="flex gap-1 sm:hidden">
                                  {isHoliday && <span className="h-1.5 w-1.5 rounded-full bg-holiday" />}
                                  {isBuddhist && <BuddhaLogo variant="mark" className="h-3 w-3 text-gold-text" />}
                                  {markers.other.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-muted" />}
                                </span>
                                {/* Tablet: one label; desktop: up to two, each wrapping to at most two lines. */}
                                {labels.slice(0, 2).map((item, i) => (
                                  <span
                                    key={item.key}
                                    className={cn(
                                      "hidden items-start gap-1 text-[11px] font-medium leading-tight lg:text-xs",
                                      i === 0 ? "sm:flex" : "lg:flex",
                                      item.tone === "holiday" && "text-holiday",
                                      item.tone === "buddhist" && "text-gold-text",
                                      item.tone === "other" && "text-muted",
                                    )}
                                  >
                                    {item.tone === "buddhist" ? (
                                      <BuddhaLogo variant="mark" className="h-3.5 w-3.5 shrink-0" />
                                    ) : (
                                      <span
                                        className={cn(
                                          "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                                          item.tone === "holiday" ? "bg-holiday" : "bg-muted",
                                        )}
                                      />
                                    )}
                                    <span className="line-clamp-2 min-w-0 hyphens-auto wrap-break-word">{item.text}</span>
                                  </span>
                                ))}
                                {labels.length > 1 && (
                                  <span className="hidden text-[11px] leading-tight text-muted sm:block lg:hidden">
                                    {t("moreItems", { count: localizeNumber(labels.length - 1, locale) })}
                                  </span>
                                )}
                                {labels.length > 2 && (
                                  <span className="hidden text-xs leading-tight text-muted lg:block">
                                    {t("moreItems", { count: localizeNumber(labels.length - 2, locale) })}
                                  </span>
                                )}
                              </span>
                            )
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="space-y-1">
                        <p className="font-semibold text-forest">{formatGregorian(day.date, locale)}</p>
                        <p className="text-muted">{lunarLong(day.lunar, locale)}</p>
                        {labels.map((item) => (
                          <p
                            key={item.key}
                            className={cn(
                              "font-medium",
                              item.tone === "holiday" && "text-holiday",
                              item.tone === "buddhist" && "text-gold-text",
                            )}
                          >
                            {item.text}
                          </p>
                        ))}
                        {(markers.isPreceptDay || day.lunar.is_full_moon || day.lunar.is_new_moon || day.lunar.is_shaving_day) && (
                          <p className="text-gold-text">
                            {[
                              markers.isPreceptDay && t("silaDay"),
                              day.lunar.is_full_moon && t("fullMoon"),
                              day.lunar.is_new_moon && t("newMoon"),
                              day.lunar.is_shaving_day && t("shavingDay"),
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
