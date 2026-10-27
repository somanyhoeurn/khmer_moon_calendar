import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MonthGrid } from "@/components/calendar/month-grid";
import type { CalendarMonth } from "@/types/api";
import october from "../fixtures/month-2026-10.json";
import { renderWithProviders } from "../utils";

const month = october as CalendarMonth;

describe("MonthGrid", () => {
  it("renders every day with its lunar date", () => {
    renderWithProviders(<MonthGrid year={2026} month={10} days={month.days} locale="en" />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(31);
    expect(screen.getByRole("button", { name: /11 October 2026, 15 waning, Phatrabot/ })).toBeInTheDocument();
  });

  it("uses Khmer numerals and lunar labels in Khmer", () => {
    renderWithProviders(<MonthGrid year={2026} month={10} days={month.days} locale="km" />, { locale: "km" });
    expect(screen.getByRole("button", { name: /២៧ តុលា ២០២៦, ១រោច ខែអស្សុជ/ })).toBeInTheDocument();
  });

  it("marks today and supports keyboard navigation and selection", async () => {
    const onSelect = vi.fn();
    renderWithProviders(<MonthGrid year={2026} month={10} days={month.days} locale="en" onSelect={onSelect} />);
    const today = screen.getByRole("button", { name: /27 October 2026/ });
    expect(today).toHaveAttribute("aria-current", "date");
    expect(today).toHaveAttribute("tabindex", "0");

    today.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: /28 October 2026/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getByRole("button", { name: /21 October 2026/ })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("2026-10-21");
  });
});
