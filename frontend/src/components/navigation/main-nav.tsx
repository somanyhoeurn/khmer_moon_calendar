"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BuddhaLogo } from "@/components/branding/buddha-logo";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils/cn";

const ITEMS = [
  { href: "/", key: "home" },
  { href: "/calendar", key: "calendar" },
  { href: "/holidays", key: "holidays" },
  { href: "/lunar-date", key: "converter" },
] as const;

export function MainNav() {
  const t = useTranslations("nav");
  const meta = useTranslations("meta");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const links = (mobile: boolean) =>
    ITEMS.map((item) => (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={() => setOpen(false)}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={cn(
            "block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted hover:text-forest",
            isActive(item.href) && "bg-sage text-forest",
            mobile && "py-3 text-base",
          )}
        >
          {t(item.key)}
        </Link>
      </li>
    ));

  return (
    <nav aria-label={t("primary")}>
      <ul className="hidden items-center gap-1 lg:flex">{links(false)}</ul>
      {/* Small screens: shadcn Sheet (Radix Dialog) handles focus trapping, Escape and scroll locking. */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-forest hover:bg-surface-muted lg:hidden"
          aria-label={t("menu")}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </SheetTrigger>
        <SheetContent closeLabel={t("closeMenu")}>
          <div className="flex items-center gap-2 pr-10">
            <BuddhaLogo framed className="h-9 w-9" />
            <SheetTitle>{meta("siteName")}</SheetTitle>
          </div>
          <SheetDescription className="sr-only">{t("primary")}</SheetDescription>
          <nav aria-label={t("primary")}>
            <ul className="space-y-1">{links(true)}</ul>
          </nav>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
