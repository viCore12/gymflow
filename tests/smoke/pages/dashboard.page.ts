import { type Page, type Locator, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator("h1", { hasText: "Welcome to GymFlow Admin" });
    this.logoutButton = page.locator("button", { hasText: "Đăng xuất" });
  }

  async waitForLoad() {
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
  }

  async navigate() {
    await this.page.goto("/");
    await this.waitForLoad();
  }

  async logout() {
    await this.logoutButton.click();
    await expect(this.page).toHaveURL(/login/, { timeout: 10_000 });
  }
}
