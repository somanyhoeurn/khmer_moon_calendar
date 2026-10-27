"use client";

import { Check, Copy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { BuddhaLogo } from "@/components/branding/buddha-logo";
import { MoonPhaseIcon } from "@/components/lunar-date/moon-phase-icon";
import { VerificationBadge } from "@/components/lunar-date/verification-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { dayMarkers, recordDescription } from "@/lib/calendar/observances";
import { formatRange, localizeNumber, lunarLong, monthName } from "@/lib/date/format";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import type { CalendarDay, CalendarEvent, Holiday } from "@/types/api";

type Tone = "holiday" | "buddhist" | "other";

function bilingual(record: Holiday | CalendarEvent, km: boolean): { primary: string; secondary: string } {
  const [kmName, enName] = "name_en" in record ? [record.name_km, record.name_en] : [record.title_km, record.title_en];
  return km ? { primary: kmName, secondary: enName } : { primary: enName, secondary: kmName };
}

/** Full details for one day, opened by clicking a date in the grid or the month list. */
export function DayDialog({
  day,
  holidays,
  events,
  open,
  onOpenChange,
}: {
  day: CalendarDay | undefined;
  holidays: Holiday[];
  events: CalendarEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("calendar");
  const th = useTranslations("holidays");
  const locale = useLocale();
  const km = locale === "km";
  const [copied, setCopied] = useState(false);

  if (!day) return null;
  const { lunar } = day;
  const [y, m, d] = day.date.split("-").map(Number) as [number, number, number];
  const other = km ? "en" : "km";

  const title = t("dayTitle", {
    weekday: km ? lunar.weekday.name_km : lunar.weekday.name_en,
    day: localizeNumber(d, locale),
    month: monthName(m, locale),
    year: localizeNumber(y, locale),
  });
  const otherDate = km ? `${monthName(m, "en")} ${d}, ${y}` : `${localizeNumber(d, "km")} ${monthName(m, "km")} ${localizeNumber(y, "km")}`;

  const qualities = [lunar.is_sila_day && t("silaDay"), lunar.is_full_moon && t("fullMoon"), lunar.is_new_moon && t("newMoon"), lunar.is_shaving_day && t("shavingDay")].filter(
    (q): q is string => Boolean(q),
  );
  const markers = dayMarkers(day, holidays, events);
  const records: { record: Holiday | CalendarEvent; tone: Tone }[] = [
    ...markers.publicHolidays.map((record) => ({ record, tone: "holiday" as const })),
    ...markers.buddhist.map((record) => ({ record, tone: "buddhist" as const })),
    ...markers.other.map((record) => ({ record, tone: "other" as const })),
  ];

  const facts: [string, string][] = [
    [t("lunarMonth"), km ? lunar.month.name_km : lunar.month.name_en],
    [t("beYear"), localizeNumber(lunar.be_year, locale)],
    [t("animalYear"), km ? lunar.animal_year.name_km : lunar.animal_year.name_en],
    [t("sak"), km ? lunar.sak.name_km : lunar.sak.name_en],
  ];

  const copy = async () => {
    const text = [title, lunarLong(lunar, locale), ...records.map(({ record }) => bilingual(record, km).primary)].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused (permissions, insecure context); the text stays selectable in the dialog.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t("close")} className="max-h-[85dvh] max-w-xl gap-4 overflow-y-auto">
        <DialogTitle>{title}</DialogTitle>

        <div className="flex items-start gap-4 border-t border-border pt-4">
          <div className="min-w-0 grow space-y-1.5">
            <DialogDescription className="text-base text-foreground">{lunarLong(lunar, locale)}</DialogDescription>
            {qualities.length > 0 && (
              <p className="font-medium text-gold-text">{t("dayIs", { list: qualities.join(t("listAnd")) })}</p>
            )}
            <p lang={other} className="text-sm text-muted">
              {otherDate}
            </p>
          </div>
          {lunar.is_sila_day ? (
            <BuddhaLogo framed className="h-16 w-16" />
          ) : (
            <MoonPhaseIcon lunar={lunar} className="h-12 w-12" />
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-surface-muted/70 p-3 text-sm sm:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>

        {records.length === 0 ? (
          <p className="text-sm text-muted">{t("noRecordsOnDay")}</p>
        ) : (
          <ul className="space-y-2">
            {records.map(({ record, tone }) => {
              const names = bilingual(record, km);
              const description = recordDescription(record, locale);
              return (
                <li
                  key={record.slug}
                  className={cn(
                    "rounded-xl border p-3 text-sm",
                    tone === "holiday" && "border-holiday/30 bg-holiday-soft/60",
                    tone === "buddhist" && "border-gold/50 bg-gold-soft",
                    tone === "other" && "border-border",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="flex min-w-0 items-start gap-1.5">
                      {tone === "buddhist" && <BuddhaLogo variant="mark" className="mt-0.5 h-4 w-4 shrink-0 text-gold-text" />}
                      <span
                        className={cn(
                          tone === "holiday" && "text-holiday",
                          tone === "buddhist" && "text-gold-text",
                          tone === "other" && "text-forest",
                        )}
                      >
                        <span className="font-semibold">{names.primary}</span>{" "}
                        <span lang={other}>({names.secondary})</span>
                      </span>
                    </p>
                    {tone === "holiday" && (
                      <Badge variant="holiday">{"name_en" in record ? th("official") : t("expectedHoliday")}</Badge>
                    )}
                  </div>
                  {record.start_date !== record.end_date && (
                    <p className="mt-1 text-xs text-muted">{formatRange(record.start_date, record.end_date, locale)}</p>
                  )}
                  {description && <p className="mt-1 text-muted">{description}</p>}
                  {/* Only sourced holidays have a detail page; rule-based ones are labelled "calculated". */}
                  {tone === "holiday" && "name_en" in record && (
                    <Link
                      href={`/holidays/${record.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                    >
                      {t("openHoliday")} →
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <VerificationBadge verification={lunar.verification} />
          <Button variant="outline" size="sm" className="rounded-full" onClick={copy}>
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            <span aria-live="polite">{copied ? t("copied") : t("copyDetails")}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
