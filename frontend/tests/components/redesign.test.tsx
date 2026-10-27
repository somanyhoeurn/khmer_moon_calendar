import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BuddhaLogo } from "@/components/branding/buddha-logo";
import { MonthGrid } from "@/components/calendar/month-grid";
import { illumination } from "@/components/lunar-date/moon-phase-icon";
import { dayMarkers } from "@/lib/calendar/observances";
import type { CalendarEvent, CalendarMonth } from "@/types/api";
import october from "../fixtures/month-2026-10.json";
import { renderWithProviders } from "../utils";

const month = october as CalendarMonth;
const day = (iso: string) => month.days.find((d) => d.date === iso)!;

describe("BuddhaLogo", () => {
  it("is decorative without a title and labelled with one", () => {
    const { container, rerender } = render(<BuddhaLogo />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    rerender(<BuddhaLogo title="Khmer Moon Calendar" />);
    expect(screen.getByRole("img", { name: "Khmer Moon Calendar" })).toBeInTheDocument();
  });
});

describe("moon phase illumination", () => {
  it("is full on 15 waxing and dark on the last waning day", () => {
    expect(illumination({ phase: "waxing", lunar_day: 15, days_in_month: 30 })).toBe(1);
    expect(illumination({ phase: "waning", lunar_day: 14, days_in_month: 29 })).toBe(0);
    expect(illumination({ phase: "waxing", lunar_day: 1, days_in_month: 30 })).toBeCloseTo(1 / 15);
  });
});

describe("day markers", () => {
  it("lists Pchum Ben once, as the public holiday, not again as the calculated observance", () => {
    const markers = dayMarkers(day("2026-10-11"), month.holidays, month.events);
    expect(markers.publicHolidays.map((h) => h.slug)).toEqual(["pchum-ben-2026"]);
    expect(markers.buddhist).toEqual([]);
    expect(markers.other).toEqual([]);
    expect(markers.isPreceptDay).toBe(true);
  });

  it("classifies Buddhist observances by category from the API", () => {
    const visak: CalendarEvent = { ...month.events[0]!, slug: "visak-x", category: "buddhist", event_type: "buddhist_observance" };
    const target = { ...day("2026-10-20"), events: ["visak-x"] };
    expect(dayMarkers(target, [], [visak]).buddhist).toHaveLength(1);
  });
});

describe("MonthGrid redesign", () => {
  it("starts weeks on Sunday and labels holidays and precept days for screen readers", () => {
    renderWithProviders(
      <MonthGrid year={2026} month={10} days={month.days} holidays={month.holidays} events={month.events} locale="en" />,
    );
    expect(screen.getAllByRole("columnheader")[0]).toHaveTextContent("Sun");
    const pchum = screen.getByRole("button", { name: /^11 October 2026,/ });
    expect(pchum).toHaveAccessibleName(/Public holiday: Pchum Ben Festival/);
    expect(pchum).toHaveAccessibleName(/Sila \(precept\) day/);
    // 1 October 2026 is a Thursday: four leading adjacent-month cells, none of them interactive.
    expect(screen.getAllByRole("button")).toHaveLength(31);
    expect(screen.getAllByRole("row")[1]!.querySelectorAll("td")[4]!.querySelector("button")).toHaveAttribute(
      "data-date",
      "2026-10-01",
    );
  });
});

describe("MonthGrid named lunar days", () => {
  it("writes full moon, new moon and the lunar month's first day in the cells", () => {
    renderWithProviders(
      <MonthGrid year={2026} month={10} days={month.days} holidays={month.holidays} events={month.events} locale="km" />,
      { locale: "km" },
    );
    // 26 Oct 2026 = ១៥កើត (full moon); 11 Oct = last day of Phatrabot (new moon); 12 Oct = ១កើត ខែអស្សុជ.
    expect(screen.getByRole("button", { name: /^២៦ តុលា ២០២៦,/ })).toHaveTextContent("ពេញបូណ៌មី");
    expect(screen.getByRole("button", { name: /^១១ តុលា ២០២៦,/ })).toHaveTextContent("ថ្ងៃខែដាច់");
    expect(screen.getByRole("button", { name: /^១២ តុលា ២០២៦,/ })).toHaveTextContent("ខែអស្សុជ");
    expect(screen.getAllByText("ពេញបូណ៌មី")).toHaveLength(1);
  });
});

describe("expected public holidays", () => {
  it("treats rule-based public-holiday days as holidays (red) when no sourced record exists", () => {
    const pchum = { ...month.events[0]!, slug: "pchum-ben-2030", expected_public_holiday: true };
    const ben = { ...month.events[0]!, slug: "kan-ben-1-2030", expected_public_holiday: false, category: "traditional" };
    const target = { ...day("2026-10-20"), holidays: [], events: ["pchum-ben-2030", "kan-ben-1-2030"] };
    const markers = dayMarkers(target, [], [pchum, ben]);
    expect(markers.publicHolidays.map((r) => r.slug)).toEqual(["pchum-ben-2030"]);
    expect(markers.other.map((r) => r.slug)).toEqual(["kan-ben-1-2030"]);
  });
});
