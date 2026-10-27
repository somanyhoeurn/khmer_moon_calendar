import { defineRouting } from "next-intl/routing";

export const locales = ["km", "en"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "km",
  localePrefix: "always",
  // Khmer is always the default; the browser language does not override it.
  localeDetection: false,
});
