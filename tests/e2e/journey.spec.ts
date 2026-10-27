import { expect, test } from "@playwright/test";
import expected from "../fixtures/published-holidays.json" with { type: "json" };

const pchum = expected.pchumBen2026;

test("core user journey", async ({ page }) => {
  // 1-2. Open the homepage (Khmer by default): the calendar marks today with its lunar date.
  await page.goto("/");
  await expect(page).toHaveURL(/\/km$/);
  await expect(page.locator("button[aria-current='date']")).toHaveAttribute("aria-label", /ខែ/);
  await expect(page.locator("#calendar-title + p")).toContainText("ព.ស.");

  // 3. Navigate to a different month (October 2026, which contains Pchum Ben).
  await page.goto("/en/calendar/2026/10");
  await page.getByRole("button", { name: "Next month" }).click();
  await expect(page.getByRole("button", { name: /^1 November 2026,/ })).toBeVisible();
  await page.getByRole("button", { name: "Previous month" }).click();

  // 4. Click a date: a dialog shows its lunar date and holiday; after closing, it stays selected in the month list.
  const day = page.getByRole("button", { name: /^11 October 2026,/ });
  await day.click();
  const details = page.getByRole("dialog");
  await expect(details).toContainText(pchum.lunarEn);
  await expect(details).toContainText(pchum.holidayNameEn);
  await page.keyboard.press("Escape");
  await expect(details).toBeHidden();
  await expect(day).toHaveAttribute("aria-pressed", "true");
  const agenda = page.locator("section[aria-labelledby='agenda-heading']");
  await expect(agenda.getByRole("button", { pressed: true })).toContainText(pchum.holidayNameEn);

  // 5. Convert a Gregorian date.
  await page.goto(`/en/lunar-date?date=${pchum.gregorian}`);
  await expect(page.getByTestId("conversion-result")).toContainText(pchum.lunarEn);

  // 6. Browse holidays.
  await page.goto("/en/holidays");
  await page.getByLabel("Search").fill("pchum");
  await expect(page.getByTestId("holiday-list").getByRole("link", { name: pchum.holidayNameEn })).toBeVisible();
  await page.getByTestId("holiday-list").getByRole("link", { name: pchum.holidayNameEn }).click();
  await expect(page).toHaveURL(new RegExp(`/en/holidays/${pchum.holidaySlug}$`));

  // 7. Switch to Khmer while keeping the same page.
  await page.getByRole("button", { name: "ខ្មែរ" }).click();
  await expect(page).toHaveURL(new RegExp(`/km/holidays/${pchum.holidaySlug}$`));
  await expect(page.locator("html")).toHaveAttribute("lang", "km");
  await expect(page.getByRole("heading", { level: 1, name: pchum.holidayNameKm })).toBeVisible();
});

test("unknown pages show a localized 404", async ({ page }) => {
  const res = await page.goto("/en/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
