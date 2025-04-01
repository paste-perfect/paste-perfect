import { expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { CodeHighlighterPage } from "./pages/code-highlighter.page";
import { test } from "./pages/code-highlighter.page";

const testCases = [
  {
    language: "JavaScript",
    rawFilename: "javascript.js",
    fixture: "javascript.html",
  },
  {
    language: "Python",
    rawFilename: "python.py",
    fixture: "python.html",
  },
  {
    language: "Markup",
    rawFilename: "markup.html",
    fixture: "markup.html",
  },
];

const modes = [
  {
    name: "Dark Mode with Tabs",
    theme: "Prism Coldark Dark",
    indentMode: "Tabs",
    indentationSize: "2",
    fixtureDir: "dark-tabs",
  },
  {
    name: "Light Mode with Spaces",
    theme: "a11y Light",
    indentMode: "Spaces",
    indentationSize: "4",
    fixtureDir: "light-spaces",
  },
];

const FIXTURES_DIR = "fixtures";

/**
 * Sets up the editor with language, theme, indentation, and fills in code.
 */
async function setupEditorWithUtils(
  page: CodeHighlighterPage,
  language: string,
  theme: string,
  indentMode: string,
  indentationSize: string,
  rawFilePath: string
) {
  await page.setLanguage(language);
  await page.setTheme(theme);
  await page.setIndentMode(indentMode);
  await page.setIndentationSize(indentationSize);
  await page.enterCodeFromFile(rawFilePath);
}

for (const mode of modes) {
  for (const { language, rawFilename, fixture } of testCases) {
    const baseName = `${language.toLowerCase().replace(/\s+/g, "-")}-${mode.fixtureDir}`;

    test.describe(`${language} (${mode.name})`, () => {
      test(`should render syntax highlighting correctly [${baseName}]`, async ({ page }) => {
        const rawCodePath = path.join(__dirname, FIXTURES_DIR, "raw", rawFilename);

        await setupEditorWithUtils(page, language, mode.theme, mode.indentMode, mode.indentationSize, rawCodePath);

        await page.expectScreenshot(`${baseName}-fullpage.png`);
      });

      test(`should copy correct plain and HTML content to clipboard [${baseName}]`, async ({ page }) => {
        const rawCodePath = path.join(__dirname, FIXTURES_DIR, "raw", rawFilename);

        await setupEditorWithUtils(page, language, mode.theme, mode.indentMode, mode.indentationSize, rawCodePath);

        await page.mockClipboardWrite();
        await page.clickCopyButton();

        const clipboardContent = await page.getClipboardContent();
        const expectedText = (await page.getHighlightedCodeText()).trim();
        expect(clipboardContent?.plainText).toBe(expectedText);

        const expectedHtmlPath = path.join(__dirname, FIXTURES_DIR, mode.fixtureDir, fixture);
        if (fs.existsSync(expectedHtmlPath)) {
          const expectedHtml = fs.readFileSync(expectedHtmlPath, "utf-8").trim();
          expect(clipboardContent?.htmlText).toBe(expectedHtml);
        } else {
          throw new Error(`Expected HTML fixture not found at path: ${expectedHtmlPath}`);
        }
      });
    });
  }
}
