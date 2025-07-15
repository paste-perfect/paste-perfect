import { expect, Page as BasePage, PageAssertionsToHaveScreenshotOptions, test as baseTest } from '@playwright/test';
import { BASE_URL } from '../../playwright.config';
import path from 'path';

export type Page = BasePage & {
  expectScreenshot: (name: string, options?: PageAssertionsToHaveScreenshotOptions) => Promise<void>;
  goToPath: (path: string) => Promise<void>;
};

export const STYLESHEET_PATH = path.resolve(process.cwd(), './snapshot-tests/styles/styles.css');

export const test = baseTest.extend<{
  page: Page;
}>({
  page: async ({ page }, use) => {
    page.expectScreenshot = async (name: string, options) => {
      options = {
        ...options,
        maxDiffPixelRatio: options?.maxDiffPixelRatio || 0.01,
        fullPage: true,
        stylePath: STYLESHEET_PATH,
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
