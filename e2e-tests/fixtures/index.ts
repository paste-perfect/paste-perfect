import { test as baseTest, expect, Page as BasePage, PageAssertionsToHaveScreenshotOptions } from '@playwright/test';
import { BASE_URL } from '../../playwright.config';

export type Page = BasePage & {
  expectScreenshot: (name: string, options?: PageAssertionsToHaveScreenshotOptions) => Promise<void>;
  goToPath: (path: string) => Promise<void>;
};

export const STYLESHEET_PATH = './e2e-tests/styles/styles.css'

export const test = baseTest.extend<{
  page: Page;
}>({
  page: async ({ page }, use) => {

    page.expectScreenshot = async (name: string, options) => {
      options = {
        ...options,
        stylePath: STYLESHEET_PATH,
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      }

      await expect(page).toHaveScreenshot(name, options);
    };

    page.goToPath = async (path: string) => {
      await page.goto(`${BASE_URL}${path}`);
    };

    await use(page);
  },
});

export { expect };
