import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MonthCalendar } from "@/features/calendar/month-calendar";
import november from "../fixtures/month-2026-11.json";
import october from "../fixtures/month-2026-10.json";
import { mockFetch, renderWithProviders } from "../utils";

describe("MonthCalendar", () => {
  it("shows a loading state, then the month with today marked and the month list", async () => {
    mockFetch({ "month=10": october });
    renderWithProviders(<MonthCalendar initialYear={2026} initialMonth={10} todayIso="2026-10-27" />);
    expect(screen.getByRole("status", { name: "Loading calendar…" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /^27 October 2026,/ })).toHaveAttribute("aria-current", "date");
    expect(screen.getByRole("heading", { name: "This month" })).toBeInTheDocument();
  });

  it("navigates to the next month", async () => {
    const fetchMock = mockFetch({ "month=10": october, "month=11": november });
    renderWithProviders(<MonthCalendar initialYear={2026} initialMonth={10} todayIso="2026-10-27" />);
    await screen.findByRole("button", { name: /27 October 2026/ });
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(await screen.findByRole("button", { name: /24 November 2026/ })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("month=11"), expect.anything());
  });

  it("opens the day's details when a date is clicked, then keeps it selected", async () => {
    mockFetch({ "month=10": october });
    renderWithProviders(<MonthCalendar initialYear={2026} initialMonth={10} todayIso="2026-10-27" />);
    const cell = await screen.findByRole("button", { name: /^11 October 2026,/ });
    await userEvent.click(cell);

    const dialog = screen.getByRole("dialog", { name: "Sunday, 11 October 2026" });
    expect(dialog).toHaveAccessibleDescription(/15th waning day of Phatrabot/);
    expect(within(dialog).getByText("This day is Sila (precept) day and New moon.")).toBeInTheDocument();
    expect(within(dialog).getByText("Pchum Ben Festival")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /Holiday details/ })).toHaveAttribute("href", "/holidays/pchum-ben-2026");

    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(cell).toHaveAttribute("aria-pressed", "true");
    const agendaRow = screen.getAllByRole("button", { pressed: true }).find((b) => !b.dataset.date);
    expect(agendaRow).toHaveTextContent("Pchum Ben Festival");
  });

  it("shows an error state with retry", async () => {
    mockFetch({});
    renderWithProviders(<MonthCalendar initialYear={2026} initialMonth={10} todayIso="2026-10-27" />);
    expect(await screen.findByText("The calendar could not be loaded.")).toBeInTheDocument();
    mockFetch({ "month=10": october });
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /27 October 2026/ })).toBeInTheDocument());
  });
});
