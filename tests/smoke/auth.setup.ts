import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "tests/smoke/.auth/state.json";

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "admin@gymflow.local");
  await page.fill("#password", "admin123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/", { timeout: 10_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
