/**
 * Flow 3 — Bán gói tập / Sell Membership Package (BLU-319 QA plan)
 * BRD D4: both time-based and session-based in scope
 * test.fixme: pending frontend membership sale pages (BLU-333)
 */

import { test, expect } from "@playwright/test";
import { MembershipPage } from "./pages/membership.page";

const TEST_CUSTOMER_URL = "/customers/test-seed-001";

test.describe("Flow 3a — Sell Time-Based Membership", () => {
  test.fixme("sell time-based package → invoice → Active → end_at set", async ({ page }) => {
    const mp = new MembershipPage(page);
    await page.goto(TEST_CUSTOMER_URL);
    await expect(page.locator("h1,[data-testid='customer-name']").first()).toBeVisible();
    await mp.clickBuyPackage();
    await mp.selectPackageByType("time-based");
    await mp.confirmSale();
    await expect(mp.invoiceConfirmation).toBeVisible({ timeout: 8_000 });
    await expect(mp.membershipStatusBadge).toBeVisible();
    await expect(mp.endDateDisplay).toBeVisible();
    const endDateText = await mp.endDateDisplay.textContent();
    expect(endDateText?.trim().length).toBeGreaterThan(0);
  });
});

test.describe("Flow 3b — Sell Session-Based Membership", () => {
  test.fixme("sell session-based package → invoice → Active → session_count set", async ({ page }) => {
    const mp = new MembershipPage(page);
    await page.goto(TEST_CUSTOMER_URL);
    await expect(page.locator("h1,[data-testid='customer-name']").first()).toBeVisible();
    await mp.clickBuyPackage();
    await mp.selectPackageByType("session-based");
    await mp.confirmSale();
    await expect(mp.invoiceConfirmation).toBeVisible({ timeout: 8_000 });
    await expect(mp.membershipStatusBadge).toBeVisible();
    await expect(mp.sessionCountDisplay).toBeVisible();
    const sessionText = await mp.sessionCountDisplay.textContent();
    expect(parseInt(sessionText?.replace(/\D/g, "") ?? "0", 10)).toBeGreaterThan(0);
  });
});
