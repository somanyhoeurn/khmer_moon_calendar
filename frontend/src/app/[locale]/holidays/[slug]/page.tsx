import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VerificationBadge } from "@/components/lunar-date/verification-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { getQueryClient } from "@/lib/api/query-client";
import { convertQuery, holidayQuery } from "@/lib/api/query-options";
import { formatGregorian, formatRange, lunarShort } from "@/lib/date/format";
import { Link } from "@/lib/i18n/navigation";

type Params = Promise<{ locale: string; slug: string }>;

/** Fetch through TanStack Query; a 404 from the API becomes null (rendered as not-found). */
async function loadHoliday(slug: string) {
  try {
    return await getQueryClient().fetchQuery(holidayQuery(slug));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) return {};
  const holiday = await loadHoliday(slug).catch(() => null);
  if (!holiday) return {};
  const km = locale === "km";
  return {
    title: km ? holiday.name_km : holiday.name_en,
    description: (km ? holiday.description_km : holiday.description_en) ?? undefined,
    alternates: { canonical: `/${locale}/holidays/${slug}`, languages: { km: `/km/holidays/${slug}`, en: `/en/holidays/${slug}` } },
  };
}

export default async function HolidayDetailPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!/^[a-z0-9-]{1,160}$/.test(slug)) notFound();
  const holiday = await loadHoliday(slug);
  if (!holiday) notFound();

  const t = await getTranslations("holidays");
  const tv = await getTranslations("verification");
  const km = locale === "km";
  const startLunar = await getQueryClient()
    .fetchQuery(convertQuery(holiday.start_date))
    .catch(() => null);
  const description = km ? (holiday.description_km ?? holiday.description_en) : (holiday.description_en ?? holiday.description_km);

  // Structured data only states what the page shows: a named public holiday with its dates.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: km ? holiday.name_km : holiday.name_en,
    startDate: holiday.start_date,
    endDate: holiday.end_date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Country", name: "Cambodia" },
  };

  return (
    <article className="mx-auto max-w-4xl space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/holidays" className="text-sm text-primary hover:underline">
        ← {t("back")}
      </Link>
      <header>
        <h1 className="text-2xl font-semibold">{km ? holiday.name_km : holiday.name_en}</h1>
        <p className="text-muted" lang={km ? "en" : "km"}>
          {km ? holiday.name_en : holiday.name_km}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {holiday.is_official_public_holiday && <Badge variant="holiday">{t("official")}</Badge>}
          <Badge>{t(`categories.${holiday.category}`)}</Badge>
        </div>
      </header>
      <Card>
        <CardContent className="p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted">{t("dates")}</dt>
              <dd className="font-medium">{formatRange(holiday.start_date, holiday.end_date, locale)}</dd>
            </div>
            {startLunar && (
              <div>
                <dt className="text-sm text-muted">{t("lunarDate")}</dt>
                <dd className="font-medium">
                  {formatGregorian(holiday.start_date, locale)}: {lunarShort(startLunar, locale)}
                </dd>
                <dd className="mt-1">
                  <VerificationBadge verification={startLunar.verification} />
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-muted">{t("status")}</dt>
              <dd>{tv(`status.${holiday.verification_status}`)}</dd>
            </div>
            {holiday.source && (
              <div>
                <dt className="text-sm text-muted">{t("source")}</dt>
                <dd>
                  {holiday.source.source_url ? (
                    <a href={holiday.source.source_url} className="text-primary hover:underline" rel="noopener noreferrer" target="_blank">
                      {holiday.source.name}
                    </a>
                  ) : (
                    holiday.source.name
                  )}
                </dd>
              </div>
            )}
            {holiday.updated_at && (
              <div>
                <dt className="text-sm text-muted">{t("lastUpdated")}</dt>
                <dd>{formatGregorian(holiday.updated_at.slice(0, 10), locale)}</dd>
              </div>
            )}
          </dl>
          {description && <p className="mt-4 max-w-3xl">{description}</p>}
        </CardContent>
      </Card>
    </article>
  );
}
