/**
 * Flow 1 — Login / Authentication (BLU-319 QA plan)
 * Steps: login form → valid creds → dashboard → refresh → logout
 * Extra: protected-route redirect, invalid credentials error
 */

import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { DashboardPage } from "./pages/dashboard.page";

test.use({ storageState: { cookies: [], origins: [] } });

const ADMIN_EMAIL = "admin@gymflow.local";
const ADMIN_PASSWORD = "admin123";

test.describe("Flow 1 — Login / Authentication", () => {
  test("full auth flow: login → dashboard → persist on refresh → logout", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.navigate();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.pageTitle).toBeVisible();

    await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL("/", { timeout: 10_000 });
    await dashboardPage.waitForLoad();

    await page.reload();
    await dashboardPage.waitForLoad();
    await expect(page).not.toHaveURL(/login/);

    await dashboardPage.logout();
    await expect(page).toHaveURL(/login/);
    await expect(loginPage.emailInput).toBeVisible();
  });

  test("step 4: unauthenticated access to protected route redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });

  test("invalid credentials shows error message", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login("wrong@example.com", "wrongpassword");
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 5_000 });
    await expect(loginPage.errorMessage).toContainText("không đúng");
  });
});
