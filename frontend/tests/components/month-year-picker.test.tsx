import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MonthYearPicker } from "@/components/calendar/month-year-picker";
import { isCoveredByHoliday } from "@/lib/calendar/observances";
import type { CalendarEvent, Holiday } from "@/types/api";
import holidays from "../fixtures/holidays-2026.json";
import { renderWithProviders } from "../utils";

describe("MonthYearPicker", () => {
  it("steps month and year within 1–12 and 2000–2030, then saves", async () => {
    const onSave = vi.fn();
    renderWithProviders(
      <MonthYearPicker year={2029} month={11} onSave={onSave}>
        November 2029
      </MonthYearPicker>,
    );
    await userEvent.click(screen.getByRole("button", { name: "November 2029" }));
    const dialog = screen.getByRole("dialog", { name: "Choose month and year" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Increase Month" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Increase Year" }));
    expect(within(dialog).getByRole("button", { name: "Increase Year" })).toBeDisabled(); // 2030 is the limit
    expect(within(dialog).getByRole("button", { name: "Increase Month" })).toBeDisabled(); // 12 is the limit

    await userEvent.clear(within(dialog).getByLabelText("Year 2000-2030"));
    await userEvent.type(within(dialog).getByLabelText("Year 2000-2030"), "1990");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith({ year: 2000, month: 12 }); // typed years are clamped
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("isCoveredByHoliday", () => {
  const base = { title_km: "", title_en: "", description_km: null, description_en: null, event_type: "commemoration", category: "national", anchor_lunar_date_km: null, anchor_lunar_date_en: null, verification_status: "calculated", source: null } as const;
  const published = holidays as Holiday[];

  it("defers fixed-date commemorations and Songkran to the published holiday of the same day", () => {
    const labour: CalendarEvent = { ...base, slug: "international-labour-day-2026", start_date: "2026-05-01", end_date: "2026-05-01", origin: "date_rule" };
    const songkran: CalendarEvent = { ...base, slug: "khmer-new-year-songkran-2026", start_date: "2026-04-14", end_date: "2026-04-16", origin: "songkran_calculation" };
    const teachers: CalendarEvent = { ...base, slug: "world-teachers-day-2026", start_date: "2026-10-05", end_date: "2026-10-05", origin: "date_rule" };
    expect(isCoveredByHoliday(labour, published)).toBe(true);
    expect(isCoveredByHoliday(songkran, published)).toBe(true);
    expect(isCoveredByHoliday(teachers, published)).toBe(false);
  });
});
