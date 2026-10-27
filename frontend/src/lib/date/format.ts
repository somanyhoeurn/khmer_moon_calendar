import type { LunarDate } from "@/types/api";

const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

export function toKhmerNumerals(value: number | string): string {
  return String(value).replace(/\d/g, (d) => KHMER_DIGITS[Number(d)] ?? d);
}

/** Khmer numerals in the Khmer UI, Latin numerals in English. */
export function localizeNumber(value: number | string, locale: string): string {
  return locale === "km" ? toKhmerNumerals(value) : String(value);
}

export const GREGORIAN_MONTHS_KM = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
];

export const GREGORIAN_MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Sunday-first weekday labels, as on Cambodian wall calendars. */
export const WEEKDAYS_SHORT_KM = ["អា", "ច", "អ", "ព", "ព្រ", "សុ", "ស"];
export const WEEKDAYS_SHORT_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAYS_LONG_KM = ["អាទិត្យ", "ច័ន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
export const WEEKDAYS_LONG_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function monthName(month: number, locale: string): string {
  const names = locale === "km" ? GREGORIAN_MONTHS_KM : GREGORIAN_MONTHS_EN;
  return names[month - 1] ?? String(month);
}

/** "27 October 2026" / "២៧ តុលា ២០២៦" from an ISO date without timezone shifts. */
export function formatGregorian(iso: string, locale: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${localizeNumber(d, locale)} ${monthName(m, locale)} ${localizeNumber(y, locale)}`;
}

export function formatRange(start: string, end: string, locale: string): string {
  return start === end ? formatGregorian(start, locale) : `${formatGregorian(start, locale)} – ${formatGregorian(end, locale)}`;
}

/** "កើត" / "waxing". */
export function phaseName(lunar: LunarDate, locale: string): string {
  return locale === "km" ? lunar.phase_km : lunar.phase;
}

/** Compact lunar label for calendar cells, e.g. "៩ កើត" or "9 waxing". */
export function lunarCellLabel(lunar: LunarDate, locale: string): string {
  return `${localizeNumber(lunar.lunar_day, locale)} ${phaseName(lunar, locale)}`;
}

export function lunarLong(lunar: LunarDate, locale: string): string {
  return locale === "km" ? lunar.formatted_km : lunar.formatted_en;
}

export function lunarShort(lunar: LunarDate, locale: string): string {
  return locale === "km" ? lunar.short_km : lunar.short_en;
}

export function monthOffset(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Years the calendar UI offers (the backend engine itself supports 1900–2100). */
export const MIN_YEAR = 2000;
export const MAX_YEAR = 2030;
