import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { INDEXED_YEARS } from "@/config/site";
import { YearCalendar } from "@/features/calendar/year-calendar";
import { getQueryClient } from "@/lib/api/query-client";
import { yearQuery } from "@/lib/api/query-options";
import { phnomPenhToday } from "@/lib/api/server";
import { MAX_YEAR, MIN_YEAR, localizeNumber } from "@/lib/date/format";

type Params = Promise<{ locale: string; year: string }>;

function parseYear(raw: string): number | null {
  const year = Number(raw);
  return /^\d{4}$/.test(raw) && year >= MIN_YEAR && year <= MAX_YEAR ? year : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, year: raw } = await params;
  const year = parseYear(raw);
  if (!year) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const label = localizeNumber(year, locale);
  return {
    title: t("yearTitle", { year: label }),
    description: t("yearDescription", { year: label }),
    alternates: { canonical: `/${locale}/calendar/${year}`, languages: { km: `/km/calendar/${year}`, en: `/en/calendar/${year}` } },
    // Only index years whose lunar dates have been checked against references.
    robots: year >= INDEXED_YEARS.from && year <= INDEXED_YEARS.to ? undefined : { index: false },
  };
}

export default async function YearPage({ params }: { params: Params }) {
  const { locale, year: raw } = await params;
  setRequestLocale(locale);
  const year = parseYear(raw);
  if (!year) notFound();
  await connection();
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(yearQuery(year));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <YearCalendar year={year} currentMonth={year === Number(phnomPenhToday().slice(0, 4)) ? Number(phnomPenhToday().slice(5, 7)) : 1} />
    </HydrationBoundary>
  );
}
