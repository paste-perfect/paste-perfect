import { STYLESHEET_PATH, test as base } from "../fixtures";
import { createActions } from "../utils/code-highlighter-actions";
import { createAssertions } from "../utils/code-highlighter-assertions";
import { createUtils } from "../utils/code-highlighter-utils";
import { CodeHighlighterPage } from "../types/types";
import { Page as BasePage } from "playwright-core";

async function loadTestStyles(page: BasePage): Promise<void> {
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
}

/**
 * This fixture 'test' extends the base fixture so we can
 * add our new methods to Playwright's `page` object.
 */
export const test = base.extend<{ page: CodeHighlighterPage }>({
  page: async ({ page }, use) => {
    // Attach structured helpers to page
    page.actions = createActions(page);
    page.assertions = createAssertions(page);
    page.utils = createUtils(page);

    // Go to the app's root path
    await page.goToPath("/");

    // Wait for fonts to load
    await loadTestStyles(page);

    // Expose the final typed Page to the tests
    await use(page as CodeHighlighterPage);
  },
});
