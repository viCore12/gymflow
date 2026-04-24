import { type Page, type Locator } from "@playwright/test";

export class CheckinPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly memberResult: Locator;
  readonly activeMembershipInfo: Locator;
  readonly confirmCheckinButton: Locator;
  readonly successMessage: Locator;
  readonly sessionCountAfter: Locator;
  readonly errorMessage: Locator;
  readonly nextCustomerButton: Locator;
  readonly switchCustomerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('[placeholder*="Nhập tên hoặc số điện thoại"]').first();
    this.memberResult = page.locator('button:has-text("Không có SĐT")').first().or(page.locator('.w-full.text-left:has(p.font-medium)'));
    this.activeMembershipInfo = page.locator('text=Dữ liệu gói sẽ hiển thị').first();
    this.confirmCheckinButton = page.locator('button:has-text("Check-in"),button:has-text("Đang ghi nhận")').first();
    this.successMessage = page.locator('text=Check-in thành công').first();
    this.sessionCountAfter = page.locator('[data-testid="session-remaining"]').first();
    this.errorMessage = page.locator('.bg-red-50').first();
    this.nextCustomerButton = page.locator('button:has-text("Check-in khách tiếp theo")').first();
    this.switchCustomerButton = page.locator('button:has-text("Đổi KH")').first();
  }

  async navigate() { await this.page.goto("/check-in"); }
  async searchMember(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(400);
  }
  async selectFirstResult() {
    await this.memberResult.click();
    await this.page.waitForTimeout(400);
  }
  async confirmCheckin() { await this.confirmCheckinButton.click(); }
}
