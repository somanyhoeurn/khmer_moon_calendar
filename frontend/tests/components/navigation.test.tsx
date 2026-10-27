import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { MainNav } from "@/components/navigation/main-nav";
import { routerMock } from "../setup";
import { renderWithProviders } from "../utils";

describe("LanguageSwitcher", () => {
  it("switches locale while keeping the current path and query", async () => {
    renderWithProviders(<LanguageSwitcher />, { locale: "km" });
    expect(screen.getByRole("button", { name: "ខ្មែរ" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "English" }));
    expect(routerMock.replace).toHaveBeenCalledWith("/calendar/2026/10?view=month", { locale: "en", scroll: false });
  });
});

describe("MainNav", () => {
  it("opens the mobile menu sheet, marks the active page and closes again", async () => {
    renderWithProviders(<MainNav />);
    const toggle = screen.getByRole("button", { name: "Menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    const sheet = screen.getByRole("dialog", { name: "Khmer Moon Calendar" });
    expect(within(sheet).getByRole("link", { name: "Calendar" })).toHaveAttribute("aria-current", "page");
    await userEvent.click(within(sheet).getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
