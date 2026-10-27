"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { type Locale, locales } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils/cn";

const LABELS: Record<Locale, { short: string; name: string }> = {
  km: { short: "ខ្មែរ", name: "ខ្មែរ" },
  en: { short: "EN", name: "English" },
};

/** Switches language while keeping the current path and query (e.g. the selected day). */
export function LanguageSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    const query = searchParams.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    startTransition(() => router.replace(href, { locale: next, scroll: false }));
  };

  return (
    <div role="group" aria-label={t("language")} className="flex rounded-lg border border-border-strong bg-surface p-0.5">
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          onClick={() => switchTo(code)}
          disabled={pending}
          aria-pressed={code === locale}
          aria-label={LABELS[code].name}
          className={cn(
            "min-w-10 cursor-pointer rounded-md px-2 py-1 text-sm font-medium transition-colors",
            code === locale ? "bg-forest text-background" : "text-forest hover:bg-surface-muted",
          )}
        >
          {LABELS[code].short}
        </button>
      ))}
    </div>
  );
}
