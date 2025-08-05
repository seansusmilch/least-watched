import { Page, expect, Request } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { mockApiEndpoints, mockErrorResponses } from '../fixtures/api-mocks';

// API Response interceptor utility
export class ApiMocker {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Mock all external API calls
  async mockAllApis() {
    // Mock Emby API calls
    await this.page.route('**/api/mock/emby/**', (route) => {
      const url = route.request().url();
      const pathname = new URL(url).pathname.replace('/api/mock/emby', '');

      const handler = mockApiEndpoints.emby[pathname];
      if (handler) {
        const response = typeof handler === 'function' ? handler(url) : handler;
        route.fulfill({ json: response });
      } else {
        route.fulfill({ json: mockErrorResponses.notFound, status: 404 });
      }
    });

    // Mock Sonarr API calls
    await this.page.route('**/api/mock/sonarr/**', (route) => {
      const url = route.request().url();
      const pathname = new URL(url).pathname.replace('/api/mock/sonarr', '');

      const handler = mockApiEndpoints.sonarr[pathname];
      if (handler) {
        const response = typeof handler === 'function' ? handler(url) : handler;
        route.fulfill({ json: response });
      } else {
        route.fulfill({ json: mockErrorResponses.notFound, status: 404 });
      }
    });

    // Mock Radarr API calls
    await this.page.route('**/api/mock/radarr/**', (route) => {
      const url = route.request().url();
      const pathname = new URL(url).pathname.replace('/api/mock/radarr', '');

      const handler = mockApiEndpoints.radarr[pathname];
      if (handler) {
        const response = typeof handler === 'function' ? handler(url) : handler;
        route.fulfill({ json: response });
      } else {
        route.fulfill({ json: mockErrorResponses.notFound, status: 404 });
      }
    });
  }

  // Mock specific API endpoints
  async mockEmbyAuth(success: boolean = true) {
    await this.page.route('**/api/mock/emby/Users/authenticate', (route) => {
      if (success) {
        route.fulfill({ json: mockApiEndpoints.emby['/Users/authenticate'] });
      } else {
        route.fulfill({ json: mockErrorResponses.unauthorized, status: 401 });
      }
    });
  }

  async mockSonarrConnection(success: boolean = true) {
    await this.page.route(
      '**/api/mock/sonarr/api/v3/system/status',
      (route) => {
        if (success) {
          route.fulfill({
            json: mockApiEndpoints.sonarr['/api/v3/system/status'],
          });
        } else {
          route.fulfill({ json: mockErrorResponses.serverError, status: 500 });
        }
      }
    );
  }

  async mockRadarrConnection(success: boolean = true) {
    await this.page.route(
      '**/api/mock/radarr/api/v3/system/status',
      (route) => {
        if (success) {
          route.fulfill({
            json: mockApiEndpoints.radarr['/api/v3/system/status'],
          });
        } else {
          route.fulfill({ json: mockErrorResponses.serverError, status: 500 });
        }
      }
    );
  }

  // Mock timeout scenarios
  async mockApiTimeout(urlPattern: string) {
    await this.page.route(urlPattern, (route) => {
      // Simulate timeout by not responding
      setTimeout(() => {
        route.fulfill({ json: mockErrorResponses.timeout, status: 408 });
      }, 30000);
    });
  }

  // Mock slow API responses
  async mockSlowApiResponse(urlPattern: string, delay: number = 2000) {
    await this.page.route(urlPattern, (route) => {
      setTimeout(() => {
        route.continue();
      }, delay);
    });
  }

  // Track API calls
  private apiCalls: Request[] = [];

  async startTrackingApiCalls() {
    this.apiCalls = [];
    this.page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        this.apiCalls.push(request);
      }
    });
  }

  getApiCalls(): Request[] {
    return this.apiCalls;
  }

  getApiCallsCount(): number {
    return this.apiCalls.length;
  }

  async expectApiCalled(urlPattern: string | RegExp) {
    const matchingCalls = this.apiCalls.filter((call) => {
      if (typeof urlPattern === 'string') {
        return call.url().includes(urlPattern);
      }
      return urlPattern.test(call.url());
    });

    expect(matchingCalls.length).toBeGreaterThan(0);
  }

  async expectApiNotCalled(urlPattern: string | RegExp) {
    const matchingCalls = this.apiCalls.filter((call) => {
      if (typeof urlPattern === 'string') {
        return call.url().includes(urlPattern);
      }
      return urlPattern.test(call.url());
    });

    expect(matchingCalls.length).toBe(0);
  }
}

// Performance measurement utilities
export class PerformanceMeasurer {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async measurePageLoad(): Promise<number> {
    const performanceTiming = await this.page.evaluate(() => {
      return JSON.stringify(performance.timing);
    });

    const timing = JSON.parse(performanceTiming);
    return timing.loadEventEnd - timing.navigationStart;
  }

  async measureTimeToInteractive(): Promise<number> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve(performance.now());
        } else {
          window.addEventListener('load', () => {
            resolve(performance.now());
          });
        }
      });
    });
  }

  async measureApiResponseTime(apiCall: () => Promise<void>): Promise<number> {
    const startTime = Date.now();
    await apiCall();
    return Date.now() - startTime;
  }

  async expectPageLoadTime(maxTime: number) {
    const loadTime = await this.measurePageLoad();
    expect(loadTime).toBeLessThan(maxTime);
  }

  async expectApiResponseTime(apiCall: () => Promise<void>, maxTime: number) {
    const responseTime = await this.measureApiResponseTime(apiCall);
    expect(responseTime).toBeLessThan(maxTime);
  }
}

// Test data generation utilities
export class TestDataGenerator {
  static generateMediaItem() {
    return {
      title: faker.lorem.words(3),
      type: faker.helpers.arrayElement(['MOVIE', 'SERIES']),
      year: faker.date
        .between({ from: '1990-01-01', to: '2023-12-31' })
        .getFullYear(),
      genre: faker.helpers.arrayElement([
        'Action',
        'Comedy',
        'Drama',
        'Horror',
        'Sci-Fi',
      ]),
      rating: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
      quality: faker.helpers.arrayElement(['720p', '1080p', '4K']),
      fileSize: faker.number.bigInt({ min: 1000000000n, max: 10000000000n }),
      playCount: faker.number.int({ min: 0, max: 20 }),
      lastWatched: faker.helpers.maybe(() => faker.date.recent()) || null,
      deletionScore: faker.number.float({
        min: 0,
        max: 100,
        fractionDigits: 2,
      }),
    };
  }

  static generateInstance(type: 'EMBY' | 'SONARR' | 'RADARR') {
    const baseUrl =
      type === 'EMBY'
        ? 'http://localhost:8096'
        : type === 'SONARR'
        ? 'http://localhost:8989'
        : 'http://localhost:7878';

    return {
      name: `Test ${type} Server`,
      type,
      baseUrl,
      apiKey: faker.string.alphanumeric(32),
      isActive: true,
    };
  }

  static generateFolder(type: 'MOVIE' | 'SERIES') {
    const basePath = type === 'MOVIE' ? '/media/movies' : '/media/tv';

    return {
      name: type === 'MOVIE' ? 'Movies' : 'TV Shows',
      path: basePath,
      type,
      totalSize: faker.number.bigInt({ min: 1000000000n, max: 1000000000000n }),
    };
  }
}

// Accessibility testing utilities
export class AccessibilityHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async expectKeyboardNavigation(elements: string[]) {
    for (let i = 0; i < elements.length; i++) {
      await this.page.keyboard.press('Tab');
      const focusedElement = await this.page.evaluate(() =>
        document.activeElement?.getAttribute('data-testid')
      );
      expect(focusedElement).toBe(elements[i]);
    }
  }

  async expectAriaLabels(selector: string) {
    const elements = await this.page.locator(selector).all();
    for (const element of elements) {
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');

      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  }

  async expectScreenReaderText(selector: string) {
    const element = this.page.locator(selector);
    const srText = await element
      .locator('.sr-only, .visually-hidden')
      .textContent();
    expect(srText).toBeTruthy();
  }
}

// Local storage and session utilities
export class StorageHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async setLocalStorage(key: string, value: string) {
    await this.page.evaluate(
      ([key, value]) => localStorage.setItem(key, value),
      [key, value]
    );
  }

  async getLocalStorage(key: string): Promise<string | null> {
    return await this.page.evaluate((key) => localStorage.getItem(key), key);
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
  }

  async setSessionStorage(key: string, value: string) {
    await this.page.evaluate(
      ([key, value]) => sessionStorage.setItem(key, value),
      [key, value]
    );
  }

  async getSessionStorage(key: string): Promise<string | null> {
    return await this.page.evaluate((key) => sessionStorage.getItem(key), key);
  }

  async clearSessionStorage() {
    await this.page.evaluate(() => sessionStorage.clear());
  }
}

// Utility functions
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 5000
) {
  await page.waitForSelector(selector, { timeout });
}

export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e/test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

export async function expectElementVisible(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeVisible();
}

export async function expectElementNotVisible(page: Page, selector: string) {
  await expect(page.locator(selector)).not.toBeVisible();
}

export async function expectElementCount(
  page: Page,
  selector: string,
  count: number
) {
  await expect(page.locator(selector)).toHaveCount(count);
}

export async function expectTextContent(
  page: Page,
  selector: string,
  text: string
) {
  await expect(page.locator(selector)).toContainText(text);
}

// URL and navigation utilities
export async function expectUrl(page: Page, expectedUrl: string | RegExp) {
  await expect(page).toHaveURL(expectedUrl);
}

export async function expectUrlContains(page: Page, urlPart: string) {
  await expect(page).toHaveURL(new RegExp(urlPart));
}

export function parseUrlParams(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

// Form utilities
export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [field, value] of Object.entries(formData)) {
    await page.getByTestId(field).fill(value);
  }
}

export async function submitForm(
  page: Page,
  submitSelector: string = '[type="submit"]'
) {
  await page.click(submitSelector);
}

// Wait utilities
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 10000
) {
  return await page.waitForResponse(urlPattern, { timeout });
}

export async function waitForMultipleApiResponses(
  page: Page,
  urlPatterns: (string | RegExp)[],
  timeout: number = 10000
) {
  const promises = urlPatterns.map((pattern) =>
    page.waitForResponse(pattern, { timeout })
  );
  return await Promise.all(promises);
}
