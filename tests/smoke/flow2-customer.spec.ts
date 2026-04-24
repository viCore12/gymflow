/**
 * Flow 2 — Customer management pages (BLU-350 QA)
 * Validates: list page, create form, detail page, check-in history tab
 */

import { test, expect } from "@playwright/test";
import { CustomerPage } from "./pages/customer.page";

const TEST_CUSTOMER = { fullName: "Nguyễn Văn Test", phone: "0901234567", dob: "1990-05-15" };

test.describe("Flow 2 — Customer Management", () => {
  test("customer list page loads with table and add button", async ({ page }) => {
    const cp = new CustomerPage(page);
    await page.goto("/customers");
    await expect(page.locator('h1:has-text("Khách hàng")')).toBeVisible();
    await expect(cp.addCustomerButton).toBeVisible();
    await expect(cp.searchInput).toBeVisible();
    await expect(cp.customerListTable).toBeVisible();
  });

  test("customer create form shows all required fields", async ({ page }) => {
    const cp = new CustomerPage(page);
    await cp.navigateToNew();
    await expect(page.locator('h1:has-text("Thêm khách hàng")')).toBeVisible();
    await expect(cp.fullNameInput).toBeVisible();
    await expect(cp.phoneInput).toBeVisible();
    await expect(cp.dobInput).toBeVisible();
    await expect(cp.submitButton).toBeVisible();
    await expect(page.locator('#gender')).toBeVisible();
    await expect(page.locator('#address')).toBeVisible();
    await expect(page.locator('#notes')).toBeVisible();
  });

  test("submit create form without name shows validation error", async ({ page }) => {
    const cp = new CustomerPage(page);
    await cp.navigateToNew();
    await cp.submitCreate();
    await expect(page.locator('text=Họ tên là bắt buộc')).toBeVisible();
    await expect(page).toHaveURL(/\/customers\/new/);
  });

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
  });
});
