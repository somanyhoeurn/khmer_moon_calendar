import type {
  ApiErrorBody,
  CalendarEvent,
  CalendarMonth,
  CalendarYear,
  Holiday,
  LunarDate,
  LunarMonthId,
  MoonPhase,
  Page,
  ReverseConversion,
  SearchHit,
  Today,
} from "@/types/api";

const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Absolute base on the server (inside Docker: http://backend:8087), same-origin in the browser. */
function baseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.API_INTERNAL_URL ?? "http://localhost:8087";
  }
  return "";
}

type Query = Record<string, string | number | undefined>;

export async function apiGet<T>(path: string, query: Query = {}, init: RequestInit = {}): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  const url = `${baseUrl()}/api/v1${path}${qs ? `?${qs}` : ""}`;

  // Every request has a timeout and is never retried indefinitely (TanStack Query retries at most once).
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...init.headers },
    signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      body = undefined;
    }
    throw new ApiError(
      res.status,
      body?.error.code ?? "http_error",
      body?.error.message ?? res.statusText,
      body?.error.details,
    );
  }
  return (await res.json()) as T;
}

// All calls go through TanStack Query (see query-options.ts), which owns caching and retries.
export const api = {
  today: (init?: RequestInit) => apiGet<Today>("/calendar/today", {}, { cache: "no-store", ...init }),
  month: (year: number, month: number, init?: RequestInit) =>
    apiGet<CalendarMonth>("/calendar/month", { year, month }, init),
  year: (year: number, init?: RequestInit) => apiGet<CalendarYear>("/calendar/year", { year }, init),
  convert: (date: string, init?: RequestInit) => apiGet<LunarDate>("/lunar-dates/convert", { date }, init),
  reverse: (q: { year: number; month: LunarMonthId; day: number; phase: MoonPhase }, init?: RequestInit) =>
    apiGet<ReverseConversion>("/lunar-dates/reverse", q, init),
  holidays: (year: number, category?: string, init?: RequestInit) =>
    apiGet<Holiday[]>("/holidays", { year, category }, init),
  holiday: (slug: string, init?: RequestInit) => apiGet<Holiday>(`/holidays/${encodeURIComponent(slug)}`, {}, init),
  events: (year: number, month?: number, init?: RequestInit) =>
    apiGet<CalendarEvent[]>("/events", { year, month }, init),
  search: (q: string, limit = 20, offset = 0, init?: RequestInit) =>
    apiGet<Page<SearchHit>>("/search", { q, limit, offset }, init),
};
