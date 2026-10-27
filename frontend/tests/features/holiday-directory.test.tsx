import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HolidayDirectory } from "@/features/holidays/holiday-directory";
import events from "../fixtures/events-2026.json";
import holidays from "../fixtures/holidays-2026.json";
import { mockFetch, renderWithProviders } from "../utils";

describe("HolidayDirectory", () => {
  it("lists holidays and calculated observances separately", async () => {
    mockFetch({ "/holidays": holidays, "/events": events });
    renderWithProviders(<HolidayDirectory initialYear={2026} />);
    const list = await screen.findByTestId("holiday-list");
    expect(within(list).getByRole("link", { name: "Water Festival (Bon Om Touk)" })).toBeInTheDocument();
    expect(within(screen.getByTestId("event-list")).getByText("Meak Bochea")).toBeInTheDocument();
    expect(screen.queryByText("Calculated")).not.toBeInTheDocument(); // no status badges in the directory
  });

  it("filters by search text and category", async () => {
    mockFetch({ "/holidays": holidays, "/events": events });
    renderWithProviders(<HolidayDirectory initialYear={2026} />);
    await screen.findByTestId("holiday-list");

    await userEvent.type(screen.getByLabelText("Search"), "pchum");
    expect(within(screen.getByTestId("holiday-list")).getAllByRole("link")).toHaveLength(1);

    await userEvent.clear(screen.getByLabelText("Search"));
    await userEvent.selectOptions(screen.getByLabelText("Category"), "royal");
    const links = within(screen.getByTestId("holiday-list")).getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Independence Day" })).not.toBeInTheDocument();
  });

  it("shows an error state", async () => {
    mockFetch({});
    renderWithProviders(<HolidayDirectory initialYear={2026} />);
    expect(await screen.findByText("Holidays could not be loaded.")).toBeInTheDocument();
  });
});
