/**
 * Flow 4 — Check-in khách hàng / Member Check-in (BLU-319 QA plan)
 * BRD D3: manual search (no hardware); D4: earliest-expiring membership priority
 * test.fixme: pending /checkin frontend page (BLU-333)
 */

import { test, expect } from "@playwright/test";
import { CheckinPage } from "./pages/checkin.page";

test.describe("Flow 4 — Member Check-in", () => {
  test.fixme("manual search → earliest-expiry selected → attendance created", async ({ page }) => {
    const cp = new CheckinPage(page);
    await cp.navigate();
    await expect(cp.searchInput).toBeVisible();
    await cp.searchMember("Nguyễn Văn Test");
    await expect(cp.memberResult).toBeVisible({ timeout: 5_000 });
    await cp.selectFirstResult();
    await expect(cp.activeMembershipInfo).toBeVisible();
    await cp.confirmCheckin();
    await expect(cp.successMessage).toBeVisible({ timeout: 8_000 });
    const sessionVisible = await cp.sessionCountAfter.isVisible();
    if (sessionVisible) {
      const remaining = parseInt((await cp.sessionCountAfter.textContent())?.replace(/\D/g, "") ?? "-1", 10);
      expect(remaining).toBeGreaterThanOrEqual(0);
    }
  });

  test.fixme("D4: two active memberships → earliest-expiring auto-selected", async ({ page }) => {
    const cp = new CheckinPage(page);
    await cp.navigate();
    await cp.searchMember("Test Member Two-Memberships");
    await expect(cp.memberResult).toBeVisible({ timeout: 5_000 });
    await cp.selectFirstResult();
    const selectedMembership = page.locator('[data-testid="selected-membership"]').first();
    await expect(selectedMembership).toBeVisible();
    const selectedExpiry = await selectedMembership.locator("[data-testid='expiry-date']").textContent();
    const allExpiries = await page.locator("[data-testid='membership-expiry']").allTextContents();
    const sortedAsc = [...allExpiries].sort();
    expect(selectedExpiry?.trim()).toBe(sortedAsc[0]?.trim());
  });

  test.fixme("search by phone number finds correct member", async ({ page }) => {
    const cp = new CheckinPage(page);
    await cp.navigate();
    await cp.searchMember("0901234567");
    await expect(page.locator("text=Nguyễn Văn Test").first()).toBeVisible({ timeout: 5_000 });
  });
});
