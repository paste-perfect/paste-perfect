import { expect, Page as BasePage, PageAssertionsToHaveScreenshotOptions, test as baseTest } from "@playwright/test";

// ---------------------------------------------------------------------------
// Extended page type — adds `expectScreenshot` convenience helper
// ---------------------------------------------------------------------------

export type Page = BasePage & {
  /**
   * Takes a full-page screenshot and asserts it matches the stored snapshot.
   * @param name - Snapshot filename (e.g. `"my-test.png"`).
   * @param options
   */
  expectScreenshot(name: string, options?: PageAssertionsToHaveScreenshotOptions): Promise<void>;
};

export const test = baseTest.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    page.expectScreenshot = (name, options) => expect(page).toHaveScreenshot(name, { fullPage: true, ...options });

    await use(page as Page);
  },
});

export { expect };
