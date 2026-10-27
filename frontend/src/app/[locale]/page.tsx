import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MonthCalendar } from "@/features/calendar/month-calendar";
import { getQueryClient } from "@/lib/api/query-client";
import { monthQuery, todayQuery } from "@/lib/api/query-options";
import { phnomPenhToday } from "@/lib/api/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    description: t("homeDescription"),
    alternates: { canonical: `/${locale}`, languages: { km: "/km", en: "/en" } },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await connection(); // always render with the current Cambodian date
  const meta = await getTranslations("meta");

  const queryClient = getQueryClient();
  const today = await queryClient.fetchQuery(todayQuery()).catch(() => null);
  const todayIso = today?.date.gregorian_date ?? phnomPenhToday();
  const year = Number(todayIso.slice(0, 4));
  const month = Number(todayIso.slice(5, 7));
  await queryClient.prefetchQuery(monthQuery(year, month));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <h1 className="sr-only">{meta("siteName")}</h1>
      <MonthCalendar initialYear={year} initialMonth={month} todayIso={todayIso} />
    </HydrationBoundary>
  );
}
