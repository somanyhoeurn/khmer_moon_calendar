import { queryOptions } from "@tanstack/react-query";
import { api } from "./client";

// Shared by server prefetching and client hooks so query keys always match.
export const todayQuery = () =>
  queryOptions({
    queryKey: ["calendar", "today"],
    queryFn: ({ signal }) => api.today({ signal }),
    staleTime: 60 * 1000,
  });

export const monthQuery = (year: number, month: number) =>
  queryOptions({
    queryKey: ["calendar", "month", year, month],
    queryFn: ({ signal }) => api.month(year, month, { signal }),
  });

export const yearQuery = (year: number) =>
  queryOptions({
    queryKey: ["calendar", "year", year],
    queryFn: ({ signal }) => api.year(year, { signal }),
  });

export const holidaysQuery = (year: number) =>
  queryOptions({
    queryKey: ["holidays", year],
    queryFn: ({ signal }) => api.holidays(year, undefined, { signal }),
  });

export const holidayQuery = (slug: string) =>
  queryOptions({
    queryKey: ["holiday", slug],
    queryFn: ({ signal }) => api.holiday(slug, { signal }),
  });

export const eventsQuery = (year: number, month?: number) =>
  queryOptions({
    queryKey: ["events", year, month ?? "all"],
    queryFn: ({ signal }) => api.events(year, month, { signal }),
  });

export const convertQuery = (date: string) =>
  queryOptions({
    queryKey: ["lunar-dates", "convert", date],
    queryFn: ({ signal }) => api.convert(date, { signal }),
  });
