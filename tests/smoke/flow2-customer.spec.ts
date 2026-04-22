/**
 * Flow 2 — Tạo khách hàng / Create Customer (BLU-319 QA plan)
 * test.fixme: pending /customers/new frontend page (BLU-333)
 */

import { test, expect } from "@playwright/test";
import { CustomerPage } from "./pages/customer.page";

const TEST_CUSTOMER = { fullName: "Nguyễn Văn Test", phone: "0901234567", dob: "1990-05-15" };

test.describe("Flow 2 — Create Customer", () => {
  test.fixme("full create-customer flow: fill form → list → search → profile", async ({ page }) => {
    const cp = new CustomerPage(page);
    await cp.navigateToNew();
    await expect(cp.fullNameInput).toBeVisible();
    await cp.fillCreateForm(TEST_CUSTOMER.fullName, TEST_CUSTOMER.phone, TEST_CUSTOMER.dob);
    await cp.submitCreate();
    await expect(page).toHaveURL(/customers/, { timeout: 8_000 });
    await expect(page.locator(`text=${TEST_CUSTOMER.fullName}`).first()).toBeVisible();
    await cp.searchByPhone(TEST_CUSTOMER.phone);
    await expect(page.locator(`text=${TEST_CUSTOMER.fullName}`).first()).toBeVisible();
    await cp.openCustomerByName(TEST_CUSTOMER.fullName);
    await cp.openTransactionHistory();
    await expect(cp.emptyHistoryMessage).toBeVisible();
  });

  test.fixme("submit without required fields shows validation errors", async ({ page }) => {
    const cp = new CustomerPage(page);
    await cp.navigateToNew();
    await cp.submitCreate();
    await expect(page).toHaveURL(/customers\/new/);
  });
});
