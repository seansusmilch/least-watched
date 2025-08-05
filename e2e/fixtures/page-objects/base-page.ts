import { Page, expect } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Common navigation methods
  async goto(path: string) {
    await this.page.goto(path);
  }

  async goHome() {
    await this.page.goto('/');
  }

  async goToSettings() {
    await this.page.goto('/settings');
  }

  // Common UI element getters
  get sidebar() {
    return this.page.getByTestId('app-sidebar');
  }

  get loading() {
    return this.page.getByTestId('loading');
  }

  get errorMessage() {
    return this.page.getByTestId('error-message');
  }

  get toast() {
    return this.page.getByTestId('toast');
  }

  get themeToggle() {
    return this.page.getByTestId('theme-toggle');
  }

  // Navigation helpers
  async clickSidebarItem(itemName: string) {
    await this.sidebar.getByRole('link', { name: itemName }).click();
  }

  // Common actions
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForElement(selector: string, timeout: number = 5000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  async waitForApiCall(urlPattern: string | RegExp) {
    return await this.page.waitForResponse(urlPattern);
  }

  // Theme switching
  async switchTheme() {
    await this.themeToggle.click();
  }

  async switchToLightTheme() {
    const currentTheme = await this.page.evaluate(() =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
    if (currentTheme === 'dark') {
      await this.switchTheme();
    }
  }

  async switchToDarkTheme() {
    const currentTheme = await this.page.evaluate(() =>
      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
    if (currentTheme === 'light') {
      await this.switchTheme();
    }
  }

  // Error handling
  async expectNoErrors() {
    await expect(this.errorMessage).not.toBeVisible();
  }

  async expectError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  // Toast notifications
  async expectToast(message?: string) {
    await expect(this.toast).toBeVisible();
    if (message) {
      await expect(this.toast).toContainText(message);
    }
  }

  async waitForToastToDisappear() {
    await this.toast.waitFor({ state: 'hidden' });
  }

  // Loading states
  async waitForLoadingToComplete() {
    await expect(this.loading).not.toBeVisible();
  }

  async expectLoading() {
    await expect(this.loading).toBeVisible();
  }

  // Common assertions
  async expectPageTitle(title: string) {
    await expect(this.page).toHaveTitle(title);
  }

  async expectUrl(url: string) {
    await expect(this.page).toHaveURL(url);
  }

  async expectUrlContains(urlPart: string) {
    await expect(this.page).toHaveURL(new RegExp(urlPart));
  }

  // Utility methods
  async scrollToBottom() {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  async scrollToTop() {
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `e2e/test-results/screenshots/${name}.png`,
    });
  }

  // Form helpers
  async fillInput(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async clickButton(selector: string) {
    await this.page.click(selector);
  }

  async selectOption(selector: string, value: string) {
    await this.page.selectOption(selector, value);
  }

  async checkCheckbox(selector: string) {
    await this.page.check(selector);
  }

  async uncheckCheckbox(selector: string) {
    await this.page.uncheck(selector);
  }

  // Table helpers
  async getTableRowCount(tableSelector: string): Promise<number> {
    return await this.page.locator(`${tableSelector} tbody tr`).count();
  }

  async getTableCellText(
    tableSelector: string,
    row: number,
    col: number
  ): Promise<string> {
    return (
      (await this.page
        .locator(
          `${tableSelector} tbody tr:nth-child(${row + 1}) td:nth-child(${
            col + 1
          })`
        )
        .textContent()) || ''
    );
  }

  async clickTableRow(tableSelector: string, row: number) {
    await this.page
      .locator(`${tableSelector} tbody tr:nth-child(${row + 1})`)
      .click();
  }

  // Wait helpers
  async waitForTimeout(timeout: number) {
    await this.page.waitForTimeout(timeout);
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }
}
