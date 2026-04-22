import { test as base } from "../fixtures";
import { createActions } from "../utils/code-highlighter-actions";
import { createAssertions } from "../utils/code-highlighter-assertions";
import { createUtils } from "../utils/code-highlighter-utils";
import { CodeHighlighterPage } from "../types/types";

/**
 * Injects a MutationObserver that disables spellcheck on all textareas before
 * the page loads. Prevents Playwright flakiness caused by red-underline decorations
 * interfering with text selection and clipboard actions.
 */
function disableSpellcheckScript(): void {
  const observer = new MutationObserver(() => {
    document
      .querySelectorAll<HTMLTextAreaElement>('textarea:not([spellcheck="false"])')
      .forEach((el) => el.setAttribute("spellcheck", "false"));
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export const test = base.extend<{ page: CodeHighlighterPage }>({
  page: async ({ page }, use) => {
    await page.addInitScript(disableSpellcheckScript);
    await page.goto("/");

    const partialPage = page as Omit<CodeHighlighterPage, "utils">;
    partialPage.actions = createActions(page);
    partialPage.assertions = createAssertions(page);
    (page as CodeHighlighterPage).utils = createUtils(partialPage);

    await use(page as CodeHighlighterPage);
  },
});

export { expect } from "../fixtures";
