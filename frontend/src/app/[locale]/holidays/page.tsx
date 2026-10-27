import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HolidayDirectory } from "@/features/holidays/holiday-directory";
import { getQueryClient } from "@/lib/api/query-client";
import { eventsQuery, holidaysQuery } from "@/lib/api/query-options";
import { phnomPenhToday } from "@/lib/api/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("holidaysTitle"),
    description: t("holidaysDescription"),
    alternates: { canonical: `/${locale}/holidays`, languages: { km: "/km/holidays", en: "/en/holidays" } },
  };
}

export default async function HolidaysPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await connection();
  const t = await getTranslations("holidays");
  const year = Number(phnomPenhToday().slice(0, 4));
  const queryClient = getQueryClient();
  await Promise.all([queryClient.prefetchQuery(holidaysQuery(year)), queryClient.prefetchQuery(eventsQuery(year))]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="text-2xl font-semibold text-forest">{t("heading")}</h1>
        <p className="max-w-3xl text-muted">{t("intro")}</p>
        <HolidayDirectory initialYear={year} />
      </div>
    </HydrationBoundary>
  );
}
