/**
 * Flow 5 — Chạy Payroll / Payroll Run (BLU-319 QA plan)
 *
 * BRD v1 FINAL decisions (BLU-313):
 *   D11 — base salary by tier
 *   D12 — commission cap: 20,000,000 VND/month
 *   D13 — pro-rate: base by actual working days; commission by actual sales/sessions
 *   D14 — receptionist earns commission (same % as trainers)
 *   D16 — all commission rates admin-configurable; defaults below match BRD seed values
 *
 * Default commission rates (admin-configurable, BRD FINAL):
 *   Sale %: 1-month 5% / 3-month 8% / 6-month 10% / 12-month 12% / PT-package 15%
 *   PT session: Junior 50,000 / Senior 100,000 / Head 150,000 VND/session
 *   Base salary: Receptionist 4,500,000 / Junior 5,000,000 / Senior 7,000,000 / Head 10,000,000
 *   Cap: 20,000,000 VND/month  |  Floor: none
 *
 * BRD verification scenarios (used as acceptance assertions):
 *   A — HLV Senior, 2 package sales + 30 PT sessions, 2 absent days → 9,843,636 VND
 *   B — Receptionist, 1 × 1-month package sale                      → 4,550,000 VND
 *   C — Head Coach, 5 × 12-month package + 60 PT sessions           → capped at 20,000,000 VND
 *
 * test.fixme: pending payroll UI (E4 Sprint 2). Tests are spec-complete and will
 * activate automatically once BLU-317 delivers the /hr/payroll frontend.
 */

import { test, expect } from "@playwright/test";
import { PayrollPage } from "./pages/payroll.page";

const TEST_PERIOD = "2026-05";

// Seed staff identifiers — must match test DB seed in packages/db
const STAFF_SENIOR_HLV = "HLV Nguyễn Senior";
const STAFF_RECEPTIONIST = "Lễ tân Trần Thị A";
const STAFF_HEAD_COACH = "Head Coach Lê Văn B";

// BRD scenario expected totals (VND, integer — no decimals in VND)
const SCENARIO_A_EXPECTED = 9_843_636; // HLV Senior, 2 gói + 30 buổi, 2 ngày nghỉ
const SCENARIO_B_EXPECTED = 4_550_000; // Lễ tân, 1 gói 1 tháng
const SCENARIO_C_EXPECTED = 20_000_000; // Head Coach, 5 gói 12 tháng + 60 buổi → capped

// Tolerance ±1 VND for rounding differences between DB precision and UI display
const TOLERANCE = 1;

test.describe("Flow 5 — Payroll Run", () => {
  test.fixme(
    "navigate to payroll page and select period",
    async ({ page }) => {
      const pp = new PayrollPage(page);
      await pp.navigate();
      await expect(pp.periodSelect).toBeVisible();
      await expect(pp.runPayrollButton).toBeVisible();
      await pp.selectPeriod(TEST_PERIOD);
      await expect(pp.periodSelect).toHaveValue(TEST_PERIOD);
    }
  );

  test.fixme(
    "payroll run generates payslip for all active staff",
    async ({ page }) => {
      const pp = new PayrollPage(page);
      await pp.navigate();
      await pp.selectPeriod(TEST_PERIOD);
      await pp.runPayroll();
      await expect(pp.payrollTable).toBeVisible();
      // All three seed staff must appear
      await expect(pp.staffRow(STAFF_SENIOR_HLV)).toBeVisible();
      await expect(pp.staffRow(STAFF_RECEPTIONIST)).toBeVisible();
      await expect(pp.staffRow(STAFF_HEAD_COACH)).toBeVisible();
    }
  );

  test.fixme(
    "Scenario A — HLV Senior: pro-rated base + session commission = 9,843,636 VND",
    async ({ page }) => {
      const pp = new PayrollPage(page);
      await pp.navigate();
      await pp.selectPeriod(TEST_PERIOD);
      await pp.runPayroll();

      // D13: verify working days reflected (26 standard − 2 absent = 24)
      await expect(pp.staffWorkingDays(STAFF_SENIOR_HLV)).toContainText("24");

      const total = await pp.parsePay(pp.staffTotalPay(STAFF_SENIOR_HLV));
      expect(total).toBeGreaterThanOrEqual(SCENARIO_A_EXPECTED - TOLERANCE);
      expect(total).toBeLessThanOrEqual(SCENARIO_A_EXPECTED + TOLERANCE);
    }
  );

  test.fixme(
    "Scenario B — Receptionist: base + sale commission = 4,550,000 VND (D14 confirmed)",
    async ({ page }) => {
      const pp = new PayrollPage(page);
      await pp.navigate();
      await pp.selectPeriod(TEST_PERIOD);
      await pp.runPayroll();

      const total = await pp.parsePay(pp.staffTotalPay(STAFF_RECEPTIONIST));
      expect(total).toBeGreaterThanOrEqual(SCENARIO_B_EXPECTED - TOLERANCE);
      expect(total).toBeLessThanOrEqual(SCENARIO_B_EXPECTED + TOLERANCE);

      // Payslip detail: base 4,500,000 + commission 50,000 (5% of 1M package)
      await pp.openPayslip(STAFF_RECEPTIONIST);
      const base = await pp.parsePay(pp.staffBaseSalary(STAFF_RECEPTIONIST));
      expect(base).toBe(4_500_000);
      const commission = await pp.parsePay(pp.staffCommission(STAFF_RECEPTIONIST));
      expect(commission).toBe(50_000);
    }
  );

  test.fixme(
    "Scenario C — Head Coach: commission cap at 20,000,000 VND (D12)",
    async ({ page }) => {
      const pp = new PayrollPage(page);
      await pp.navigate();
      await pp.selectPeriod(TEST_PERIOD);
      await pp.runPayroll();

      const total = await pp.parsePay(pp.staffTotalPay(STAFF_HEAD_COACH));
      // D12: hard cap 20M regardless of uncapped calculation
      expect(total).toBe(SCENARIO_C_EXPECTED);

      // Payslip must show cap indicator
      await pp.openPayslip(STAFF_HEAD_COACH);
      await expect(
        pp.page.locator("[data-testid='commission-capped-badge']")
      ).toBeVisible();
    }
  );

  test.fixme(
    "payroll export — CSV download completes",
    async ({ page }) => {
      const pp = new PayrollPage(page);
      await pp.navigate();
      await pp.selectPeriod(TEST_PERIOD);
      await pp.runPayroll();

      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 10_000 }),
        pp.exportCsvButton.click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/payroll.*\.csv$/i);
    }
  );

  test.fixme(
    "payroll export — PDF download completes",
    async ({ page }) => {
      const pp = new PayrollPage(page);
      await pp.navigate();
      await pp.selectPeriod(TEST_PERIOD);
      await pp.runPayroll();

      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 10_000 }),
        pp.exportPdfButton.click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/payroll.*\.pdf$/i);
    }
  );
});
