import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GregorianToLunarForm, LunarToGregorianForm } from "@/features/date-converter/converter";
import converted from "../fixtures/convert-2026-10-11.json";
import { mockFetch, renderWithProviders } from "../utils";

describe("date converter", () => {
  it("validates the Gregorian date", async () => {
    renderWithProviders(<GregorianToLunarForm initialDate="" />);
    await userEvent.click(screen.getByRole("button", { name: "Convert" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("This field is required.");
  });

  it("converts a Gregorian date and shows verification", async () => {
    mockFetch({ "lunar-dates/convert": converted, "/events": [] });
    renderWithProviders(<GregorianToLunarForm initialDate="2026-10-11" />);
    await userEvent.click(screen.getByRole("button", { name: "Convert" }));
    const result = await screen.findByTestId("conversion-result");
    expect(result).toHaveTextContent("15th waning day of Phatrabot");
    expect(result).toHaveTextContent("Verified");
  });

  it("shows the API's message for an invalid lunar date", async () => {
    mockFetch({
      "lunar-dates/reverse": new Response(
        JSON.stringify({ error: { code: "invalid_lunar_date", message: "BE 2570 has a leap month" } }),
        { status: 422 },
      ),
    });
    renderWithProviders(<LunarToGregorianForm defaultBeYear={2570} />);
    await userEvent.selectOptions(screen.getByLabelText("Lunar month"), "asadh");
    await userEvent.click(screen.getByRole("button", { name: "Convert" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("BE 2570 has a leap month");
  });

  it("validates lunar day range", async () => {
    renderWithProviders(<LunarToGregorianForm defaultBeYear={2570} />);
    const day = screen.getByLabelText("Day (1–15)");
    await userEvent.clear(day);
    await userEvent.type(day, "16");
    await userEvent.click(screen.getByRole("button", { name: "Convert" }));
    expect(await screen.findByText("Day must be between 1 and 15.")).toBeInTheDocument();
  });
});
