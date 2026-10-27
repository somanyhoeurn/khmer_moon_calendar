"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { VerificationBadge } from "@/components/lunar-date/verification-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Select } from "@/components/ui/form-controls";
import { ApiError } from "@/lib/api/client";
import { useConvertToGregorian, useConvertToLunar } from "@/lib/api/queries";
import { formatGregorian, lunarLong } from "@/lib/date/format";
import { Link } from "@/lib/i18n/navigation";
import { LUNAR_MONTH_IDS, type CalendarEvent, type LunarDate } from "@/types/api";
import {
  type GregorianForm,
  type LunarForm,
  type LunarFormInput,
  gregorianSchema,
  lunarSchema,
} from "./schemas";

const MONTH_NAMES_KM: Record<string, string> = {
  migasir: "មិគសិរ",
  boss: "បុស្ស",
  meak: "មាឃ",
  phalkun: "ផល្គុន",
  cheit: "ចេត្រ",
  pisakh: "ពិសាខ",
  jesth: "ជេស្ឋ",
  asadh: "អាសាឍ",
  srap: "ស្រាពណ៍",
  phatrabot: "ភទ្របទ",
  assoch: "អស្សុជ",
  kadeuk: "កត្តិក",
  pathamasadh: "បឋមាសាឍ",
  tutiyasadh: "ទុតិយាសាឍ",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ResultCard({ lunar, events }: { lunar: LunarDate; events: CalendarEvent[] }) {
  const t = useTranslations("converter");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const text = `${formatGregorian(lunar.gregorian_date, locale)} — ${lunarLong(lunar, locale)}`;
  const [y, m] = lunar.gregorian_date.split("-").map(Number);
  const related = events.filter((e) => e.start_date <= lunar.gregorian_date && e.end_date >= lunar.gregorian_date);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  const share = async () => {
    const url = `${window.location.origin}/${locale}/lunar-date?date=${lunar.gregorian_date}`;
    if (navigator.share) await navigator.share({ title: text, url }).catch(() => undefined);
    else await navigator.clipboard?.writeText(url).catch(() => undefined);
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-muted/50 p-4" data-testid="conversion-result">
      <p className="text-lg font-semibold">{formatGregorian(lunar.gregorian_date, locale)}</p>
      <p className="text-xl text-primary">{lunarLong(lunar, locale)}</p>
      <VerificationBadge verification={lunar.verification} showHint />
      {related.length > 0 && (
        <div>
          <p className="text-sm font-medium">{t("relatedEvents")}</p>
          <ul className="list-inside list-disc text-sm">
            {related.map((e) => (
              <li key={e.slug}>{locale === "km" ? e.title_km : e.title_en}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? t("copied") : t("copy")}
        </Button>
        <Button variant="outline" size="sm" onClick={share}>
          <Share2 className="h-4 w-4" aria-hidden />
          {t("share")}
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/calendar/${y}/${m}`}>{t("openInCalendar")}</Link>
        </Button>
      </div>
    </div>
  );
}

function ApiErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof ApiError ? error.message : String(error);
  return (
    <p role="alert" className="rounded-md bg-holiday-soft p-3 text-sm text-holiday">
      {message}
    </p>
  );
}

export function GregorianToLunarForm({ initialDate, autoSubmit = false }: { initialDate?: string; autoSubmit?: boolean }) {
  const t = useTranslations("converter");
  const conversion = useConvertToLunar();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GregorianForm>({ resolver: zodResolver(gregorianSchema), defaultValues: { date: initialDate ?? "" } });

  const onSubmit = async ({ date }: GregorianForm) => {
    await conversion.mutateAsync(date).catch(() => undefined);
  };

  // Links such as /lunar-date?date=2026-10-27 (quick convert, share) show the result immediately.
  useEffect(() => {
    if (autoSubmit) void handleSubmit(onSubmit)();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("gregorianToLunar")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-start gap-2">
          <div className="grow">
            <Label htmlFor="gregorian-date">{t("date")}</Label>
            <Input
              id="gregorian-date"
              type="date"
              min="2000-01-01"
              max="2030-12-31"
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? "gregorian-date-error" : undefined}
              {...register("date")}
            />
            <FieldError id="gregorian-date-error" message={errors.date?.message && t(`errors.${errors.date.message}`)} />
          </div>
          <Button type="submit" className="mt-7" disabled={isSubmitting}>
            {isSubmitting ? t("converting") : t("convert")}
          </Button>
        </form>
        <ApiErrorMessage error={conversion.error} />
        {conversion.data && <ResultCard lunar={conversion.data.lunar} events={conversion.data.events} />}
      </CardContent>
    </Card>
  );
}

export function LunarToGregorianForm({ defaultBeYear }: { defaultBeYear: number }) {
  const t = useTranslations("converter");
  const locale = useLocale();
  const conversion = useConvertToGregorian();
  const result = conversion.data;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LunarFormInput, unknown, LunarForm>({
    resolver: zodResolver(lunarSchema),
    defaultValues: { year: defaultBeYear, month: "pisakh", day: 15, phase: "waxing" },
  });

  const onSubmit = async (values: LunarForm) => {
    await conversion.mutateAsync(values).catch(() => undefined);
  };

  const err = (name: keyof LunarFormInput) => errors[name]?.message && t(`errors.${errors[name]?.message}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("lunarToGregorian")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="lunar-year">{t("beYear")}</Label>
            <Input
              id="lunar-year"
              type="number"
              inputMode="numeric"
              aria-invalid={Boolean(errors.year)}
              aria-describedby="lunar-year-hint"
              {...register("year")}
            />
            <p id="lunar-year-hint" className="mt-1 text-xs text-muted">
              {t("beYearHint")}
            </p>
            <FieldError id="lunar-year-error" message={err("year")} />
          </div>
          <div>
            <Label htmlFor="lunar-month">{t("month")}</Label>
            <Select id="lunar-month" aria-invalid={Boolean(errors.month)} {...register("month")}>
              {LUNAR_MONTH_IDS.map((id) => (
                <option key={id} value={id}>
                  {locale === "km" ? MONTH_NAMES_KM[id] : capitalize(id)}
                </option>
              ))}
            </Select>
            <FieldError id="lunar-month-error" message={err("month")} />
          </div>
          <div>
            <Label htmlFor="lunar-day">{t("day")}</Label>
            <Input id="lunar-day" type="number" min={1} max={15} aria-invalid={Boolean(errors.day)} {...register("day")} />
            <FieldError id="lunar-day-error" message={err("day")} />
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">{t("phase")}</legend>
            <div className="flex h-10 items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" value="waxing" {...register("phase")} /> {t("waxing")}
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="waning" {...register("phase")} /> {t("waning")}
              </label>
            </div>
          </fieldset>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("converting") : t("convert")}
            </Button>
          </div>
        </form>
        <ApiErrorMessage error={conversion.error} />
        {result && (
          <div className="space-y-3">
            <p className="text-sm font-medium">{t("candidates")}</p>
            {result.ambiguous && <p className="text-sm text-muted">{t("ambiguous")}</p>}
            {result.candidates.map((c) => (
              <ResultCard key={c.gregorian_date} lunar={c} events={[]} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
