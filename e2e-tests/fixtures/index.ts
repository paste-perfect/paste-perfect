import { test as baseTest, expect, Page as BasePage, PageAssertionsToHaveScreenshotOptions } from '@playwright/test';
import { BASE_URL } from '../../playwright.config';

export type Page = BasePage & {
  expectScreenshot: (name: string, options?: PageAssertionsToHaveScreenshotOptions) => Promise<void>;
  goToPath: (path: string) => Promise<void>;
};

const STYLESHEET_PATH = './e2e-tests/styles/styles.css'

async function loadTestStyles(page: BasePage): Promise<void> {
  // Add styles for testing to have a comparable font
  await page.addStyleTag({
    path: STYLESHEET_PATH
  });

  // Wait for fonts to load
  await page.evaluate(() => {
    return document.fonts.ready;
  });

  // Verify font is loaded
  const fontLoaded = await page.evaluate(() => {
    return document.fonts.check('16px Roboto');
  });

  if (!fontLoaded) {
    console.warn('Roboto font failed to load, falling back to system fonts');
  }
}

export const test = baseTest.extend<{
  page: Page;
}>({
  page: async ({ page }, use) => {
    await loadTestStyles(page);

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
