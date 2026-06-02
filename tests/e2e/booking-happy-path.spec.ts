import { test, expect } from "@playwright/test";

// Walks the full public wizard: intro -> dates -> guests -> services -> details
// -> confirmation, asserting the server-computed deposit is shown.
//
// Dates: October 2026 is in-season (season ends 2026-10-31), block-free
// (the only seeded block is 2026-06-10..12), and after the calendar's fixed
// opening month (season start, May 2026), so navigation is deterministic.
test("books the X1 through every step to the confirmation summary", async ({ page }) => {
  await page.goto("/book/x1");

  // Intro -> wizard
  await page.getByRole("button", { name: "Customize your experience" }).click();

  // Dates: advance to October 2026, then pick a 4-night range.
  const nextMonth = page.getByRole("button", { name: "Next month" });
  const startDay = page.getByLabel("2026-10-10", { exact: true });
  for (let i = 0; i < 12 && !(await startDay.count()); i++) {
    await nextMonth.click();
  }
  await startDay.click();
  await page.getByLabel("2026-10-14", { exact: true }).click();

  // Next is enabled once a valid range is stored on the draft.
  const next = page.getByRole("button", { name: "Next", exact: true });
  await expect(next).toBeEnabled();
  await next.click();

  // Guests: 4 -> 6
  await page.getByRole("button", { name: "Increase guests" }).click();
  await page.getByRole("button", { name: "Increase guests" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Services: pick one option, then continue
  await page.getByRole("button", { name: /Dinner/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Details
  await page.getByLabel("Full name").fill("Test Charterer");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByRole("button", { name: /Proceed to checkout/ }).click();

  // Confirmation
  await expect(page).toHaveURL(/\/confirmation$/);
  await expect(page.getByText("Deposit due")).toBeVisible();
});
