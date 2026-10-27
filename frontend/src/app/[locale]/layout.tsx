import type { Metadata, Viewport } from "next";
import { Battambang, Rubik } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/components/shared/providers";
import { ThemeSync, themeInitScript } from "@/components/shared/theme-toggle";
import { siteConfig } from "@/config/site";
import { routing } from "@/lib/i18n/routing";

// Both fonts are SIL OFL 1.1 and self-hosted by next/font at build time (no runtime Google requests).
// Rubik sets Latin text; Khmer characters fall through to Battambang (see --font-sans in globals.css).
const rubik = Rubik({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-rubik",
});

const battambang = Battambang({
  subsets: ["khmer"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-battambang",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f1" },
    { media: "(prefers-color-scheme: dark)", color: "#101713" },
  ],
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: `${t("siteName")} · ${t("tagline")}`, template: `%s · ${t("siteName")}` },
    description: t("homeDescription"),
    applicationName: siteConfig.name,
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      locale: locale === "km" ? "km_KH" : "en_US",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <html lang={locale} className={`${rubik.variable} ${battambang.variable}`} suppressHydrationWarning>
      <head>
        {/* Tiny inline script prevents a dark-mode flash before hydration. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/* Desktop: exactly one screen tall; the calendar fits it and long pages scroll inside <main>. */}
      <body className="flex min-h-screen flex-col xl:h-dvh xl:overflow-hidden">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:text-forest focus:py-2"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <Providers>
            <ThemeSync />
            <SiteHeader />
            <main id="main" className="mx-auto w-full flex-1 px-4 py-4 lg:px-6 xl:min-h-0 xl:overflow-y-auto">
              {children}
            </main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
