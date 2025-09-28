import { test as base } from "../fixtures";
import { createActions } from "../utils/code-highlighter-actions";
import { createAssertions } from "../utils/code-highlighter-assertions";
import { createUtils } from "../utils/code-highlighter-utils";
import { CodeHighlighterPage } from "../types/types";

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
    await page.goto("/");

    // Expose the final typed Page to the tests
    await use(page as CodeHighlighterPage);
  },
});
