"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import type { LunarMonthId, MoonPhase } from "@/types/api";
import { api } from "./client";
import { eventsQuery, holidaysQuery, monthQuery, todayQuery, yearQuery } from "./query-options";

export function useToday() {
  return useQuery(todayQuery());
}

export function useCalendarMonth(year: number, month: number) {
  return useQuery({ ...monthQuery(year, month), placeholderData: keepPreviousData });
}

export function useCalendarYear(year: number) {
  return useQuery(yearQuery(year));
}

export function useHolidays(year: number) {
  return useQuery(holidaysQuery(year));
}

export function useEvents(year: number, month?: number) {
  return useQuery(eventsQuery(year, month));
}

/** Gregorian → lunar, plus the events of that month for the "related events" list. */
export function useConvertToLunar() {
  return useMutation({
    mutationFn: async (date: string) => {
      const [y, m] = date.split("-").map(Number);
      const [lunar, events] = await Promise.all([
        api.convert(date),
        api.events(y ?? 0, m, {}).catch(() => []),
      ]);
      return { lunar, events };
    },
  });
}

export function useConvertToGregorian() {
  return useMutation({
    mutationFn: (q: { year: number; month: LunarMonthId; day: number; phase: MoonPhase }) => api.reverse(q),
  });
}
