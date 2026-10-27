import { useTranslations } from "next-intl";
import { BuddhaLogo } from "@/components/branding/buddha-logo";
import { MoonPhaseIcon } from "@/components/lunar-date/moon-phase-icon";

const FULL = { phase: "waxing", lunar_day: 15, days_in_month: 30 } as const;
const NEW = { phase: "waning", lunar_day: 15, days_in_month: 30 } as const;

/** Explains every colour and icon used in the grid; nothing relies on colour alone. */
export function CalendarLegend({ className }: { className?: string }) {
  const t = useTranslations("calendar");
  const item = "flex items-center gap-1.5";
  return (
    <ul aria-label={t("legend")} className={className ?? "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted"}>
      <li className={item}>
        <span aria-hidden className="h-3 w-3 rounded-sm border border-primary bg-sage" />
        {t("todayLabel")}
      </li>
      <li className={item}>
        <span aria-hidden className="h-3 w-3 rounded-sm border border-holiday/40 bg-holiday-soft" />
        {t("holiday")}
      </li>
      <li className={item}>
        <span aria-hidden className="flex h-3 w-3 items-center justify-center rounded-sm border border-gold/60 bg-gold-soft" />
        {t("buddhistObservance")}
      </li>
      <li className={item}>
        <BuddhaLogo variant="mark" className="h-4 w-4 text-gold-text" />
        {t("silaDay")}
      </li>
      <li className={item}>
        <MoonPhaseIcon lunar={FULL} className="h-3.5 w-3.5" />
        {t("fullMoon")}
      </li>
      <li className={item}>
        <MoonPhaseIcon lunar={NEW} className="h-3.5 w-3.5" />
        {t("newMoon")}
      </li>
    </ul>
  );
}
