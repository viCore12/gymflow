import { type Page, type Locator, expect } from "@playwright/test";

export class PayrollPage {
  readonly page: Page;
  readonly periodSelect: Locator;
  readonly runPayrollButton: Locator;
  readonly payrollTable: Locator;
  readonly exportCsvButton: Locator;
  readonly exportPdfButton: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.periodSelect = page.locator("[data-testid='payroll-period-select']");
    this.runPayrollButton = page.locator("[data-testid='run-payroll-btn']");
    this.payrollTable = page.locator("[data-testid='payroll-table']");
    this.exportCsvButton = page.locator("[data-testid='export-csv-btn']");
    this.exportPdfButton = page.locator("[data-testid='export-pdf-btn']");
    this.loadingSpinner = page.locator("[data-testid='payroll-loading']");
  }

  async navigate() {
    await this.page.goto("/hr/payroll");
    await expect(this.periodSelect).toBeVisible({ timeout: 8_000 });
  }

  async selectPeriod(yearMonth: string) {
    await this.periodSelect.selectOption(yearMonth);
  }

  async runPayroll() {
    await this.runPayrollButton.click();
    await this.loadingSpinner.waitFor({ state: "hidden", timeout: 15_000 });
    await expect(this.payrollTable).toBeVisible({ timeout: 10_000 });
  }

  staffRow(staffName: string): Locator {
    return this.payrollTable.locator(`[data-testid='payroll-row']`, { hasText: staffName });
  }

  staffTotalPay(staffName: string): Locator {
    return this.staffRow(staffName).locator("[data-testid='total-pay']");
  }

  staffBaseSalary(staffName: string): Locator {
    return this.staffRow(staffName).locator("[data-testid='base-salary']");
  }

  staffCommission(staffName: string): Locator {
    return this.staffRow(staffName).locator("[data-testid='commission']");
  }

  staffWorkingDays(staffName: string): Locator {
    return this.staffRow(staffName).locator("[data-testid='working-days']");
  }

  payslipModal(staffName: string): Locator {
    return this.page.locator("[data-testid='payslip-modal']", { hasText: staffName });
  }

  async openPayslip(staffName: string) {
    await this.staffRow(staffName).locator("[data-testid='view-payslip-btn']").click();
    await expect(this.payslipModal(staffName)).toBeVisible({ timeout: 5_000 });
  }

  async parsePay(locator: Locator): Promise<number> {
    const text = await locator.textContent();
    return parseInt((text ?? "0").replace(/[^0-9]/g, ""), 10);
  }
}
