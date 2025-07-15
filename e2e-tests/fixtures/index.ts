import { expect, Page as BasePage, PageAssertionsToHaveScreenshotOptions, test as baseTest } from '@playwright/test';
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

async function ensureFontsLoaded(page: BasePage): Promise<void> {
  // Add styles for testing to have a comparable font
  await page.addStyleTag({
    path: STYLESHEET_PATH,
  });

  // Wait for fonts to load
  await page.waitForFunction(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");

  // Verify font is loaded
  const fontLoaded = await page.evaluate(() => {
    return document.fonts.check("16px Roboto");
  });

  const props = page.evaluate(() => ({
    fonts: document.fonts,
    stylesheets: document.styleSheets,
  }));
  console.log('Props: ', props);

  if (!fontLoaded) {
    console.warn("Roboto font failed to load, falling back to system fonts");
  }
}

export const test = baseTest.extend<{
  page: Page;
}>({
  page: async ({ page }, use) => {
    await ensureFontsLoaded(page);

    page.expectScreenshot = async (name: string, options) => {
      options = {
        ...options,
        stylePath: STYLESHEET_PATH,
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      }

      await page.waitForTimeout(99999);
      await expect(page).toHaveScreenshot(name, options);
    };

    page.goToPath = async (path: string) => {
      await page.goto(`${BASE_URL}${path}`);
    };

    await use(page);
  },
});

export { expect };
