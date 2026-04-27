import { test as base } from "../fixtures";
import { createActions } from "../utils/code-highlighter-actions";
import { createAssertions } from "../utils/code-highlighter-assertions";
import { createUtils } from "../utils/code-highlighter-utils";
import { CodeHighlighterPage } from "../types/types";

export const test = base.extend<{ page: CodeHighlighterPage }>({
  page: async ({ page }, use) => {
    await page.goto("/");

    // Disable spellcheck on every DOM element to prevent red squiggly
    // underlines from appearing in snapshot tests.
    await page.evaluate(() => {
      document.querySelectorAll("*").forEach((el) => {
        el.setAttribute("spellcheck", "false");
        (el as HTMLElement).spellcheck = false;
      });
      document.body.setAttribute("spellcheck", "false");
      document.documentElement.setAttribute("spellcheck", "false");
    });

    const partialPage = page as Omit<CodeHighlighterPage, "utils">;
    partialPage.actions = createActions(page);
    partialPage.assertions = createAssertions(page);
    (page as CodeHighlighterPage).utils = createUtils(partialPage);

    await use(page as CodeHighlighterPage);
  },
});

export { expect } from "../fixtures";
