import { type Page, type Locator } from "@playwright/test";

export class MembershipPage {
  readonly page: Page;
  readonly buyPackageButton: Locator;
  readonly confirmSaleButton: Locator;
  readonly membershipStatusBadge: Locator;
  readonly invoiceConfirmation: Locator;
  readonly sessionCountDisplay: Locator;
  readonly endDateDisplay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.buyPackageButton = page.locator('button:has-text("Mua gói"),[data-testid="buy-package"]').first();
    this.confirmSaleButton = page.locator('button:has-text("Xác nhận"),button:has-text("Thanh toán"),[data-testid="confirm-sale"]').first();
    this.membershipStatusBadge = page.locator('[data-testid="membership-status"],text=Active,text=Hoạt động').first();
    this.invoiceConfirmation = page.locator('[data-testid="invoice"],text=Hóa đơn').first();
    this.sessionCountDisplay = page.locator('[data-testid="session-count"],text=Buổi còn lại').first();
    this.endDateDisplay = page.locator('[data-testid="end-date"],text=Ngày hết hạn').first();
  }

  async clickBuyPackage() { await this.buyPackageButton.click(); }
  async selectPackageByType(type: "time-based" | "session-based") {
    const sel = type === "time-based"
      ? '[data-package-type="time"],text=Theo thời gian'
      : '[data-package-type="session"],text=Theo buổi';
    await this.page.locator(sel).first().click();
  }
  async confirmSale() { await this.confirmSaleButton.click(); }
}
