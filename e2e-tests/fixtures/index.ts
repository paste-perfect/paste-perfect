import { test as baseTest, expect, Page as BasePage, PageAssertionsToHaveScreenshotOptions } from '@playwright/test';
import { BASE_URL } from '../../playwright.config';
import path from 'path';
import fs from 'fs';

export type Page = BasePage & {
  expectScreenshot: (name: string, options?: PageAssertionsToHaveScreenshotOptions) => Promise<void>;
  goToPath: (path: string) => Promise<void>;
};

export const STYLESHEET_PATH = path.resolve(process.cwd(), './e2e-tests/styles/styles.css');

console.log("Current working directory:", process.cwd());
console.log("Stylesheet path:", STYLESHEET_PATH);
console.log("File exists:", fs.existsSync(STYLESHEET_PATH));

// Track font loading state per test
const fontLoadingState = new Map<string, boolean>();

async function ensureFontsLoaded(page: BasePage, testId: string): Promise<void> {
  if (fontLoadingState.get(testId)) {
    return; // Fonts already loaded for this test
  }

  // Add styles for testing to have a comparable font
  await page.addStyleTag({
    path: STYLESHEET_PATH,
  });

  // Wait for fonts to load
  await page.waitForFunction(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");

  await page.evaluate(() => console.log("Fonts: ", document.fonts));
  await page.evaluate(() => console.log("Stylesheets: ", document.styleSheets));

  // Verify font is loaded
  const fontLoaded = await page.evaluate(() => {
    return document.fonts.check("16px Roboto");
  });

  if (!fontLoaded) {
    console.warn("Roboto font failed to load, falling back to system fonts");
  }

  fontLoadingState.set(testId, true);
}
export const test = baseTest.extend<{
  page: Page;
}>({
  page: async ({ page }, use, testInfo) => {
    const testId = testInfo.testId;

    page.expectScreenshot = async (name: string, options) => {
      await ensureFontsLoaded(page, testId);

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
