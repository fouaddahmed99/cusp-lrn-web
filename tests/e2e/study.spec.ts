import { expect, test } from "@playwright/test";

// Runs against `pnpm build:sample` (fake SAMPLE content).

test("question bank: answer key is never fetched before submitting", async ({ page }) => {
  const answerRequests: string[] = [];
  page.on("request", (r) => r.url().includes("/content/a/") && answerRequests.push(r.url()));
  await page.goto("/app/qbank/");
  await page.getByRole("button", { name: /^Start \d+ question/ }).click();
  await expect(page.getByRole("radio").first()).toBeVisible();
  expect(answerRequests).toHaveLength(0);
  await page.getByRole("radio").first().check();
  expect(answerRequests).toHaveLength(0);
  await page.getByRole("button", { name: "Submit answer" }).click();
  await expect(page.getByRole("heading", { name: "Explanation" })).toBeVisible();
  expect(answerRequests).toHaveLength(1);
  // Citations link to the public source.
  await expect(page.locator('a[target="_blank"]').filter({ hasText: "SAMPLE" }).first()).toBeVisible();
});

test("pages render and show the SAMPLE banner", async ({ page }) => {
  for (const path of ["/", "/app/", "/app/simulator/", "/app/library/", "/app/oce/", "/app/flashcards/", "/app/analytics/", "/app/planner/", "/app/settings/", "/content-integrity/", "/attribution/", "/legal/terms/"]) {
    const res = await page.goto(path);
    expect(res?.ok(), path).toBe(true);
  }
  await page.goto("/app/");
  await expect(page.getByText("SAMPLE data.")).toBeVisible();
});

test("progress export produces a backup file", async ({ page }) => {
  await page.goto("/app/settings/");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export progress" }).click();
  expect((await download).suggestedFilename()).toMatch(/^cusp-lrn-progress-.*\.json$/);
});
