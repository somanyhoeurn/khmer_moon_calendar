import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom lacks ResizeObserver, which Radix (shadcn Tooltip, Select, ScrollArea) uses for positioning and sizing.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// next-intl navigation helpers depend on the Next router; tests get lightweight stand-ins.
export const routerMock = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() };

vi.mock("@/lib/i18n/navigation", async () => {
  const React = await import("react");
  return {
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
      React.createElement("a", { href, ...rest }, children),
    useRouter: () => routerMock,
    usePathname: () => "/calendar/2026/10",
    redirect: vi.fn(),
    getPathname: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("view=month"),
  useRouter: () => routerMock,
  usePathname: () => "/km/calendar/2026/10",
  notFound: vi.fn(),
}));
