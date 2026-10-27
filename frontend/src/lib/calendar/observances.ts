import type { CalendarDay, CalendarEvent, Holiday } from "@/types/api";

export function isBuddhistHoliday(holiday: Holiday): boolean {
  return holiday.category === "buddhist";
}

export function isBuddhistEvent(event: CalendarEvent): boolean {
  return event.category === "buddhist" || event.event_type === "buddhist_observance";
}

/** A calculated observance or commemoration that a sourced holiday record already represents. */
export function isCoveredByHoliday(event: CalendarEvent, holidays: Holiday[]): boolean {
  const year = event.start_date.slice(0, 4);
  return holidays.some(
    (h) =>
      h.slug === event.slug ||
      (h.lunar_rule !== null && event.slug === `${h.lunar_rule}-${h.start_date.slice(0, 4)}`) ||
      // Fixed-date commemorations defer to the published holiday on the same day (e.g. Labour Day + Visak 2026).
      (event.origin === "date_rule" && h.start_date <= event.start_date && h.end_date >= event.start_date) ||
      (event.origin === "songkran_calculation" && h.slug === `khmer-new-year-${year}`),
  );
}

export interface DayMarkers {
  /** Sourced public holidays, plus rule-based days that are normally public holidays (`expected_public_holiday`). */
  publicHolidays: (Holiday | CalendarEvent)[];
  /** Buddhist holidays and observances, from the API's category data only. */
  buddhist: (Holiday | CalendarEvent)[];
  /** Other events and non-public holidays not already covered above. */
  other: (Holiday | CalendarEvent)[];
  /** ថ្ងៃសីល (precept day), as computed by the backend engine. */
  isPreceptDay: boolean;
}

/** Classifies what falls on a day using only the records the API returned for it. */
export function dayMarkers(day: CalendarDay, holidays: Holiday[], events: CalendarEvent[]): DayMarkers {
  const dayHolidays = holidays.filter((h) => day.holidays.includes(h.slug));
  const dayEvents = events.filter((e) => day.events.includes(e.slug) && !isCoveredByHoliday(e, dayHolidays));
  const expected = dayEvents.filter((e) => e.expected_public_holiday);
  const remaining = dayEvents.filter((e) => !e.expected_public_holiday);
  return {
    publicHolidays: [...dayHolidays.filter((h) => h.is_official_public_holiday), ...expected],
    buddhist: [...dayHolidays.filter((h) => !h.is_official_public_holiday && isBuddhistHoliday(h)), ...remaining.filter(isBuddhistEvent)],
    other: [
      ...dayHolidays.filter((h) => !h.is_official_public_holiday && !isBuddhistHoliday(h)),
      ...remaining.filter((e) => !isBuddhistEvent(e)),
    ],
    isPreceptDay: day.lunar.is_sila_day,
  };
}

export function recordTitle(record: Holiday | CalendarEvent, locale: string): string {
  if ("name_en" in record) return locale === "km" ? record.name_km : record.name_en;
  return locale === "km" ? record.title_km : record.title_en;
}

export function recordDescription(record: Holiday | CalendarEvent, locale: string): string | null {
  return locale === "km" ? record.description_km : record.description_en;
}
