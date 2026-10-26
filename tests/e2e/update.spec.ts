import { expect, test } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Runs against `pnpm build:sample`. Simulates a publish by changing the served
// manifest on disk while a service-worker-controlled page is open.
const manifestPath = path.resolve(import.meta.dirname, "..", "..", "out", "content", "manifest.json");

test("a new publish is picked up with one reload, and the student is told", async ({ page }) => {
  const original = readFileSync(manifestPath, "utf8");
  try {
    await page.goto("/app/qbank/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); // now controlled by the service worker
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    const before = await page.evaluate(() => fetch("/content/manifest.json").then((r) => r.json()));

    // "Deploy" new content.
    const next = { ...JSON.parse(original), contentVersion: `${before.contentVersion}-next` };
    writeFileSync(manifestPath, JSON.stringify(next));

    // The open page notices and offers a reload; nothing reloads on its own.
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await expect(page.getByText("An update is available.")).toBeVisible();

    // One reload is enough: content requests go to the network first.
    await page.reload();
    const after = await page.evaluate(() => fetch("/content/manifest.json").then((r) => r.json()));
    expect(after.contentVersion).toBe(next.contentVersion);
    await expect(page.getByText("An update is available.")).toHaveCount(0);
  } finally {
    writeFileSync(manifestPath, original);
  }
});

test("content still loads from cache when offline", async ({ page, context }) => {
  await page.goto("/app/qbank/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.evaluate(() => fetch("/content/manifest.json"));
  await context.setOffline(true);
  const ok = await page.evaluate(() => fetch("/content/manifest.json").then((r) => r.ok));
  expect(ok).toBe(true);
  await context.setOffline(false);
});
