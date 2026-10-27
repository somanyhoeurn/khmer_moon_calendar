import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GregorianToLunarForm, LunarToGregorianForm } from "@/features/date-converter/converter";
import { phnomPenhToday } from "@/lib/api/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("converterTitle"),
    description: t("converterDescription"),
    alternates: { canonical: `/${locale}/lunar-date`, languages: { km: "/km/lunar-date", en: "/en/lunar-date" } },
  };
}

export default async function LunarDatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await connection();
  const { date } = await searchParams;
  const t = await getTranslations("converter");
  const today = phnomPenhToday();
  const initialDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today;
  // BE year after Visak Bochea ≈ AD + 544; the user can adjust it.
  const defaultBeYear = Number(today.slice(0, 4)) + 544;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <h1 className="text-2xl font-semibold text-forest">{t("heading")}</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <GregorianToLunarForm key={initialDate} initialDate={initialDate} autoSubmit={Boolean(date)} />
        <LunarToGregorianForm defaultBeYear={defaultBeYear} />
      </div>
    </div>
  );
}
