import { type Page, type Locator } from "@playwright/test";

export class CheckinPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly memberResult: Locator;
  readonly activeMembershipInfo: Locator;
  readonly confirmCheckinButton: Locator;
  readonly successMessage: Locator;
  readonly sessionCountAfter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('[placeholder*="Tìm kiếm"],#checkin-search').first();
    this.memberResult = page.locator('[data-testid="member-result"],[role="option"]').first();
    this.activeMembershipInfo = page.locator('[data-testid="active-membership"],text=Gói đang dùng').first();
    this.confirmCheckinButton = page.locator('button:has-text("Check-in"),button:has-text("Điểm danh"),[data-testid="confirm-checkin"]').first();
    this.successMessage = page.locator('[data-testid="checkin-success"],text=Check-in thành công').first();
    this.sessionCountAfter = page.locator('[data-testid="session-remaining"]').first();
  }

  async navigate() { await this.page.goto("/checkin"); }
  async searchMember(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300);
  }
  async selectFirstResult() { await this.memberResult.click(); }
  async confirmCheckin() { await this.confirmCheckinButton.click(); }
}
