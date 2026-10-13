import { expect, test } from "@playwright/test";

// Lightweight WCAG checks without extra dependencies: one h1, labelled controls, alt text, lang.
for (const path of ["/", "/app/", "/app/qbank/", "/app/settings/", "/app/onboarding/"]) {
  test(`basic accessibility: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    expect(await page.locator("h1").count()).toBeGreaterThanOrEqual(1);
    const unlabeled = await page.$$eval("input:not([type=hidden]), select, textarea", (els) =>
      els.filter((el) => {
        const id = el.getAttribute("id");
        const labelled = (id && document.querySelector(`label[for="${id}"]`)) || el.closest("label") || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
        return !labelled;
      }).length,
    );
    expect(unlabeled).toBe(0);
    expect(await page.$$eval("img", (imgs) => imgs.filter((i) => !i.hasAttribute("alt")).length)).toBe(0);
  });
}
