import { type Page, type Locator } from "@playwright/test";

export class CustomerPage {
  readonly page: Page;
  readonly fullNameInput: Locator;
  readonly phoneInput: Locator;
  readonly dobInput: Locator;
  readonly submitButton: Locator;
  readonly searchInput: Locator;
  readonly transactionHistoryTab: Locator;
  readonly emptyHistoryMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fullNameInput = page.locator('[name="fullName"],#fullName,[placeholder*="họ tên"]').first();
    this.phoneInput = page.locator('[name="phone"],#phone,[type="tel"]').first();
    this.dobInput = page.locator('[name="dob"],#dob,[type="date"]').first();
    this.submitButton = page.locator('button[type="submit"]');
    this.searchInput = page.locator('[placeholder*="Tìm kiếm"],[role="searchbox"]').first();
    this.transactionHistoryTab = page.locator('button:has-text("Lịch sử"),[role="tab"]:has-text("Lịch sử")').first();
    this.emptyHistoryMessage = page.locator('[data-testid="empty-history"],text=Chưa có giao dịch').first();
  }

  async navigateToNew() { await this.page.goto("/customers/new"); }
  async fillCreateForm(fullName: string, phone: string, dob: string) {
    await this.fullNameInput.fill(fullName);
    await this.phoneInput.fill(phone);
    await this.dobInput.fill(dob);
  }
  async submitCreate() { await this.submitButton.click(); }
  async searchByPhone(phone: string) {
    await this.searchInput.fill(phone);
    await this.page.keyboard.press("Enter");
  }
  async openCustomerByName(name: string) {
    await this.page.locator(`text=${name}`).first().click();
  }
  async openTransactionHistory() { await this.transactionHistoryTab.click(); }
}
