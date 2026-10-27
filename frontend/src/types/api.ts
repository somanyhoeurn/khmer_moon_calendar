// Mirrors backend/app/schemas. Keep in sync with /api/openapi.json.

export type MoonPhase = "waxing" | "waning";

export const LUNAR_MONTH_IDS = [
  "migasir",
  "boss",
  "meak",
  "phalkun",
  "cheit",
  "pisakh",
  "jesth",
  "asadh",
  "srap",
  "phatrabot",
  "assoch",
  "kadeuk",
  "pathamasadh",
  "tutiyasadh",
] as const;
export type LunarMonthId = (typeof LUNAR_MONTH_IDS)[number];

export type VerificationStatus = "calculated" | "verified" | "overridden";

export interface LocalizedName {
  index: number;
  name_km: string;
  name_en: string;
}

export interface Source {
  name: string;
  source_url: string | null;
  source_type: string;
  publication_year: number | null;
}

export interface Verification {
  status: VerificationStatus;
  engine: string;
  engine_version: string;
  reference_source: Source | null;
  reference_status: string | null;
  calculated_lunar_date_en: string | null;
}

export interface LunarDate {
  gregorian_date: string;
  weekday: LocalizedName;
  lunar_day: number;
  phase: MoonPhase;
  phase_km: string;
  day_of_month: number;
  days_in_month: number;
  month: { id: LunarMonthId; index: number; name_km: string; name_en: string; is_leap_month: boolean };
  be_year: number;
  js_year: number;
  animal_year: LocalizedName;
  sak: LocalizedName;
  year_has_leap_month: boolean;
  year_has_leap_day: boolean;
  is_full_moon: boolean;
  is_new_moon: boolean;
  is_sila_day: boolean;
  /** ថ្ងៃកោរ: eve of the full-moon and new-moon holy days. */
  is_shaving_day?: boolean;
  formatted_km: string;
  formatted_en: string;
  short_km: string;
  short_en: string;
  verification: Verification;
}

export interface Today {
  timezone: string;
  now: string;
  date: LunarDate;
}

export interface Holiday {
  slug: string;
  name_km: string;
  name_en: string;
  description_km: string | null;
  description_en: string | null;
  start_date: string;
  end_date: string;
  category: string;
  holiday_type: string;
  is_official_public_holiday: boolean;
  lunar_rule: string | null;
  verification_status: string;
  source: Source | null;
  updated_at: string | null;
}

export interface CalendarEvent {
  slug: string;
  title_km: string;
  title_en: string;
  description_km: string | null;
  description_en: string | null;
  event_type: string;
  category: string;
  start_date: string;
  end_date: string;
  anchor_lunar_date_km: string | null;
  anchor_lunar_date_en: string | null;
  /** Normally a public holiday, derived from a rule; never an official announcement. */
  expected_public_holiday?: boolean;
  origin: "database" | "lunar_rule" | "date_rule" | "songkran_calculation";
  verification_status: string;
  source: Source | null;
}

export interface CalendarDay {
  date: string;
  is_today: boolean;
  is_weekend: boolean;
  lunar: LunarDate;
  holidays: string[];
  events: string[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
  holidays: Holiday[];
  events: CalendarEvent[];
}

export interface CalendarYear {
  year: number;
  months: CalendarMonth[];
}

export interface ReverseConversion {
  query: Record<string, unknown>;
  candidates: LunarDate[];
  ambiguous: boolean;
}

export interface SearchHit {
  kind: "holiday" | "event" | "date";
  slug: string | null;
  title_km: string;
  title_en: string;
  start_date: string;
  end_date: string | null;
  verification_status: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}
