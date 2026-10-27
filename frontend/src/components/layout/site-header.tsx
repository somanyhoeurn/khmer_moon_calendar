import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { BuddhaLogo } from "@/components/branding/buddha-logo";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { MainNav } from "@/components/navigation/main-nav";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Link } from "@/lib/i18n/navigation";

export function SiteHeader() {
  const t = useTranslations("meta");
  const nav = useTranslations("nav");
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        {/* The brand text names the site, so the emblem itself is decorative. */}
        <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-lg">
          <BuddhaLogo framed className="h-9 w-9" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-forest sm:text-base">{t("siteName")}</span>
            <span lang={locale === "km" ? "en" : "km"} className="hidden truncate text-xs text-gold-text sm:block">
              {nav("brandSubtitle")}
            </span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <MainNav />
          <Suspense fallback={null}>
            <LanguageSwitcher />
          </Suspense>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
