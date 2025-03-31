// tests/fixtures.ts
import { test as baseTest, expect, Page as BasePage, PageAssertionsToHaveScreenshotOptions } from '@playwright/test';
import { BASE_URL } from '../../playwright.config';

export type Page = BasePage & {
  expectScreenshot: (name: string, options?: PageAssertionsToHaveScreenshotOptions) => Promise<void>;
  goToPath: (path: string) => Promise<void>;
};

export const test = baseTest.extend<{
  page: Page;
}>({
  page: async ({ page }, use) => {
    page.expectScreenshot = async (name: string, options) => {
      options = {
        fullPage: true,
        stylePath: "./e2e-tests/styles/fonts.css"
      }
      await page.waitForTimeout(1000);
      await expect(page).toHaveScreenshot(name, options);
    };

    page.goToPath = async (path: string) => {
      await page.goto(`${BASE_URL}${path}`);
    };

    await use(page);
  },
});

export { expect };
