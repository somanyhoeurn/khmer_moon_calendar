import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MonthAgenda } from "@/components/calendar/month-agenda";
import type { CalendarMonth } from "@/types/api";
import october from "../fixtures/month-2026-10.json";
import { renderWithProviders } from "../utils";

const month = october as CalendarMonth;

describe("MonthAgenda", () => {
  it("lists the month's records per day in both languages and selects a day", async () => {
    const onSelect = vi.fn();
    renderWithProviders(<MonthAgenda days={month.days} holidays={month.holidays} events={month.events} onSelect={onSelect} />, {
      locale: "km",
    });
    // Pchum Ben spans 10–12 October: one row per day, each listed once (holiday, not the calculated duplicate).
    expect(screen.getAllByText("(Pchum Ben Festival)")).toHaveLength(3);
    expect(screen.getAllByRole("button")).toHaveLength(5);

    await userEvent.click(screen.getAllByRole("button")[4]!);
    expect(onSelect).toHaveBeenCalledWith("2026-10-29");
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
});
