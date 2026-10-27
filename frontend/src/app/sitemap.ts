import type { MetadataRoute } from "next";
import { INDEXED_YEARS, siteConfig } from "@/config/site";
import { locales } from "@/lib/i18n/routing";

// Only years whose lunar dates were checked against published references are listed.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/calendar", "/holidays", "/lunar-date"];
  for (let year = INDEXED_YEARS.from; year <= INDEXED_YEARS.to; year++) {
    paths.push(`/calendar/${year}`);
    for (let month = 1; month <= 12; month++) paths.push(`/calendar/${year}/${month}`);
  }
  return paths.map((path) => ({
    url: `${siteConfig.url}/km${path}`,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${siteConfig.url}/${l}${path}`])),
    },
  }));
}
