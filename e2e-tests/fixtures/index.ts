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
    // Add styles for testing to have a comparable font
    await page.addStyleTag({
      path: './e2e-tests/styles/fonts.css'
    });

    page.expectScreenshot = async (name: string, options) => {
      options = {
        ...options,
        stylePath: './e2e-tests/styles/fonts.css',
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      }
      await page.waitForFunction(() => document.fonts.ready)

      await expect(page).toHaveScreenshot(name, options);
    };

    page.goToPath = async (path: string) => {
      await page.goto(`${BASE_URL}${path}`);
    };

    await use(page);
  },
});

export { expect };
