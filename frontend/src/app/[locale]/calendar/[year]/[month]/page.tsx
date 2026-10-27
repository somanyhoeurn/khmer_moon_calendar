import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { INDEXED_YEARS } from "@/config/site";
import { MonthCalendar } from "@/features/calendar/month-calendar";
import { getQueryClient } from "@/lib/api/query-client";
import { monthQuery } from "@/lib/api/query-options";
import { phnomPenhToday } from "@/lib/api/server";
import { MAX_YEAR, MIN_YEAR, localizeNumber, monthName } from "@/lib/date/format";

type Params = Promise<{ locale: string; year: string; month: string }>;

function parse(rawYear: string, rawMonth: string): { year: number; month: number } | null {
  const year = Number(rawYear);
  const month = Number(rawMonth);
  if (!/^\d{4}$/.test(rawYear) || !/^\d{1,2}$/.test(rawMonth)) return null;
  if (year < MIN_YEAR || year > MAX_YEAR || month < 1 || month > 12) return null;
  return { year, month };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, year: y, month: m } = await params;
  const parsed = parse(y, m);
  if (!parsed) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const values = { month: monthName(parsed.month, locale), year: localizeNumber(parsed.year, locale) };
  const path = `/calendar/${parsed.year}/${parsed.month}`;
  return {
    title: t("calendarTitle", values),
    description: t("calendarDescription", values),
    alternates: { canonical: `/${locale}${path}`, languages: { km: `/km${path}`, en: `/en${path}` } },
    robots: parsed.year >= INDEXED_YEARS.from && parsed.year <= INDEXED_YEARS.to ? undefined : { index: false },
  };
}

export default async function MonthPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ day?: string }>;
}) {
  const { locale, year: y, month: m } = await params;
  const { day } = await searchParams;
  setRequestLocale(locale);
  const parsed = parse(y, m);
  if (!parsed) notFound();
  await connection();
  const t = await getTranslations("calendar");
  const queryClient = getQueryClient();
  const todayIso = phnomPenhToday();
  await queryClient.prefetchQuery(monthQuery(parsed.year, parsed.month));
  // Only honour ?day= when it falls inside the requested month.
  const prefix = `${parsed.year}-${String(parsed.month).padStart(2, "0")}-`;
  const initialSelected = day && /^\d{4}-\d{2}-\d{2}$/.test(day) && day.startsWith(prefix) ? day : undefined;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <h1 className="sr-only">{t("heading")}</h1>
      <MonthCalendar
        initialYear={parsed.year}
        initialMonth={parsed.month}
        todayIso={todayIso}
        initialSelected={initialSelected}
        syncUrl
      />
    </HydrationBoundary>
  );
}
