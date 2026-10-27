import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ReactElement } from "react";
import { vi } from "vitest";
import en from "@/messages/en.json";
import km from "@/messages/km.json";

export function renderWithProviders(ui: ReactElement, { locale = "en" }: { locale?: "en" | "km" } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === "km" ? km : en} timeZone="Asia/Phnom_Penh">
      <QueryClientProvider client={client}>
        <TooltipProvider>{ui}</TooltipProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

/** Routes fetch() calls to JSON fixtures by URL substring; unmatched URLs return 500. */
export function mockFetch(routes: Record<string, unknown>) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    const match = Object.entries(routes).find(([pattern]) => url.includes(pattern));
    if (!match) {
      return new Response(JSON.stringify({ error: { code: "internal_error", message: "boom" } }), { status: 500 });
    }
    const [, body] = match;
    if (body instanceof Response) return body;
    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  });
}
