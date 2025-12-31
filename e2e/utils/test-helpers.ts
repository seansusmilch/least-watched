import { Page } from "@playwright/test";

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("networkidle");
}

export async function waitForTableToLoad(page: Page) {
  await page.waitForSelector('[data-testid="media-table"]', { state: "visible" });
}

export async function navigateToSettings(page: Page) {
  await page.click('[data-testid="settings-link"]');
  await page.waitForURL("**/settings");
}
