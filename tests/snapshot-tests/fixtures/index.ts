import { expect, Page as BasePage, PageAssertionsToHaveScreenshotOptions, test as baseTest } from "@playwright/test";

export type Page = BasePage & {
  expectScreenshot: (name: string, options?: PageAssertionsToHaveScreenshotOptions) => Promise<void>;
};

export const test = baseTest.extend<{
  page: Page;
}>({
  page: async ({ page }, use) => {
    page.expectScreenshot = async (name: string, options) => {
      options = {
        ...options,
        fullPage: true,
      };

      await expect(page).toHaveScreenshot(name, options);
    };

    await use(page);
  },
});

export { expect };
