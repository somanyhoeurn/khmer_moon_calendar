"use client";

import { Moon, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";

/** Inline script (in <head>) applying the saved theme before paint to avoid a flash. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

function prefersDark(): boolean {
  try {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
  } catch {
    // Storage unavailable: fall back to the system preference.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

/**
 * Switching language renders a new <html> element for the other locale, which drops the
 * "dark" class the init script added. Re-apply the saved theme before the browser paints.
 */
export function ThemeSync() {
  const locale = useLocale();
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", prefersDark());
  }, [locale]);
  return null;
}

export function ThemeToggle() {
  const t = useTranslations("nav");
  const toggle = () => {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // Storage may be unavailable (private mode); the toggle still works for this page view.
    }
  };
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={t("toggleTheme")} title={t("toggleTheme")}>
      <Sun className="hidden h-5 w-5 dark:block" aria-hidden />
      <Moon className="h-5 w-5 dark:hidden" aria-hidden />
    </Button>
  );
}
