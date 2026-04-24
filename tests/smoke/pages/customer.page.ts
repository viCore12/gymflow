import { type Page, type Locator } from "@playwright/test";

export class CustomerPage {
  readonly page: Page;
  readonly fullNameInput: Locator;
  readonly phoneInput: Locator;
  readonly dobInput: Locator;
  readonly submitButton: Locator;
  readonly searchInput: Locator;
  readonly checkinsTab: Locator;
  readonly emptyCheckinsMessage: Locator;
  readonly editButton: Locator;
  readonly customerListTable: Locator;
  readonly addCustomerButton: Locator;
  readonly noCustomersMessage: Locator;
  readonly paginationControls: Locator;
  readonly infoTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fullNameInput = page.locator('#full_name').first();
    this.phoneInput = page.locator('#phone').first();
    this.dobInput = page.locator('#dob').first();
    this.submitButton = page.locator('form button[type="submit"]').first();
    this.searchInput = page.locator('[placeholder*="Tìm theo tên hoặc số điện thoại"]').first();
    this.checkinsTab = page.locator('button:has-text("Lịch sử check-in")').first();
    this.emptyCheckinsMessage = page.locator('text=Chưa có lịch sử check-in').first();
    this.editButton = page.locator('button:has-text("Chỉnh sửa")').first();
    this.customerListTable = page.locator('table').first();
    this.addCustomerButton = page.locator('button:has-text("Thêm KH")').first();
    this.noCustomersMessage = page.locator('text=Chưa có khách hàng nào').first();
    this.paginationControls = page.locator('button:has-text("Trước"),button:has-text("Sau")');
    this.infoTab = page.locator('button:has-text("Thông tin")').first();
  }

  async navigateToNew() { await this.page.goto("/customers/new"); }
  async fillCreateForm(fullName: string, phone: string, dob: string) {
    await this.fullNameInput.fill(fullName);
    await this.phoneInput.fill(phone);
    await this.dobInput.fill(dob);
  }
  async submitCreate() { await this.submitButton.click(); }
  async searchByName(name: string) {
    await this.searchInput.fill(name);
    await this.page.waitForTimeout(400);
  }
  async searchByPhone(phone: string) {
    await this.searchInput.fill(phone);
    await this.page.waitForTimeout(400);
  }
  async openCustomerByName(name: string) {
    await this.page.locator(`text=${name}`).first().click();
  }
  async openCheckinHistory() { await this.checkinsTab.click(); }
  async openInfoTab() { await this.infoTab.click(); }
}
