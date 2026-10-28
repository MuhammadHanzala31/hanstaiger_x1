import { test, expect } from "@playwright/test";

// Walks the full public wizard at desktop width: dates -> guests -> services ->
// details -> confirmation, asserting the server-computed deposit is shown.
//
// Dates: October 2026 is in-season (season ends 2026-10-31) and block-free
// (the only seeded block is 2026-06-10..12). The calendar opens on the later of
// today and the season start, so we page forward until the start day appears.
test("books the X1 through every step to the confirmation summary", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("/book/x1");

  // Dates: open the calendar, advance to October 2026, then pick a 4-night range.
  await page.getByRole("button", { name: /Departure/ }).click();
  const nextMonth = page.getByRole("button", { name: "Next month" }).first();
  const startDay = page.getByLabel("2026-10-10", { exact: true }).first();
  for (let i = 0; i < 12 && !(await startDay.isVisible()); i++) {
    await nextMonth.click();
  }
  await startDay.click();
  await page.getByLabel("2026-10-14", { exact: true }).first().click();

  // Continue is enabled once a valid range is stored on the draft.
  const next = page.getByRole("button", { name: "Continue" });
  await expect(next).toBeEnabled();
  await next.click();

  // Guests: 4 -> 6
  await page.getByRole("button", { name: "Increase guests" }).click();
  await page.getByRole("button", { name: "Increase guests" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Services: expand Private Chef, pick one option, then continue
  await page.getByRole("button", { name: "Private Chef" }).first().click();
  await page.getByRole("button", { name: /Dinner/ }).first().click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Details
  await page.getByLabel("Full name").fill("Test Charterer");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByRole("button", { name: /Proceed to checkout/ }).click();

  // Confirmation
  await expect(page).toHaveURL(/\/confirmation$/);
  await expect(page.getByText("Deposit due")).toBeVisible();
});
