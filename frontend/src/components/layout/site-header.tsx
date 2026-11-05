"use client";

import { Suspense } from "react";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { MainNav } from "@/components/navigation/main-nav";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { usePathname } from "@/lib/i18n/navigation";

/** Site navigation, language and theme controls. */
export function HeaderActions() {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <MainNav />
      <ThemeToggle />
      <Suspense fallback={null}>
        <LanguageSwitcher />
      </Suspense>
    </div>
  );
}

/** Month-calendar pages put these controls in their own toolbar instead of a header row. */
const OWN_TOOLBAR = /^\/(calendar\/\d+\/\d+)?$/;

export function SiteHeader() {
  const pathname = usePathname();
  if (OWN_TOOLBAR.test(pathname)) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-14 items-center justify-end px-4 lg:px-6">
        <HeaderActions />
      </div>
    </header>
  );
}
