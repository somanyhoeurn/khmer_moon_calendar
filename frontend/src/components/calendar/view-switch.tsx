import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils/cn";

/** Month / Year segmented control. Both options are links so each view keeps its own URL. */
export function ViewSwitch({ year, month, active }: { year: number; month: number; active: "month" | "year" }) {
  const t = useTranslations("calendar");
  const options = [
    { key: "month", href: `/calendar/${year}/${month}`, label: t("monthView") },
    { key: "year", href: `/calendar/${year}`, label: t("yearView") },
  ] as const;
  return (
    <nav aria-label={t("viewMode")} className="inline-flex rounded-lg border border-border-strong bg-surface p-0.5">
      {options.map((option) => (
        <Link
          key={option.key}
          href={option.href}
          aria-current={option.key === active ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium transition-colors",
            option.key === active ? "bg-forest text-background" : "text-forest hover:bg-surface-muted",
          )}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
