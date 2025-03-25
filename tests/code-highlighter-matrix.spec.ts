import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";

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

test.describe.parallel("Code Highlighter E2E for multiple languages and modes", () => {
  for (const mode of modes) {
    for (const { language, rawFilename, fixture } of testCases) {
      test(`should highlight and copy properly for ${language} (${mode.name})`, async ({ page }) => {
        // TODO: Replace this with the env-URL somehow?
        await page.goto("http://localhost:4200");

        const input = page.locator("#source-code");
        const copyButton = page.locator("#copy-clipboard-button");
        const output = page.locator("#highlighted-code-wrapper code");

        // Load raw code from fixture
        const rawCodePath = path.join(__dirname, FIXTURES_DIR, "raw", rawFilename);
        const code = fs.readFileSync(rawCodePath, "utf-8");

        // Select language
        await page.locator("#language-selector").click();
        await page.locator(`li span:text-is("${language}")`).click();

        // Set indentation size and mode
        await page.locator("#indentation-size").fill(mode.indentationSize);
        await page.locator("#indent-mode").click();
        await page.locator(`li span:text-is("${mode.indentMode}")`).click();

        // Set theme
        await page.locator("#theme-selector").click();
        await page.locator(`li span:text-is("${mode.theme}")`).click();

        // Fill in code
        await input.fill(code);

        // Setup clipboard mock
        await page.evaluate(() => {
          window.__copiedClipboardItem = null;
          navigator.clipboard.write = (items) => {
            window.__copiedClipboardItem = items[0];
            return Promise.resolve();
          };
        });

        await copyButton.click();

        const clipboardContent = await page.evaluate(async () => {
          if (!window.__copiedClipboardItem) return null;

          const item = window.__copiedClipboardItem;
          const plainBlob = await item.getType("text/plain");
          const htmlBlob = await item.getType("text/html");

          return {
            plainText: (await plainBlob.text()).trim(),
            htmlText: (await htmlBlob.text()).trim(),
          };
        });

        const expectedText = (await output.innerText()).trim();
        expect(clipboardContent?.plainText).toBe(expectedText);

        // Load expected HTML from mode-specific fixture dir
        const expectedHtmlPath = path.join(__dirname, FIXTURES_DIR, mode.fixtureDir, fixture);
        if (fs.existsSync(expectedHtmlPath)) {
          const expectedHtml = fs.readFileSync(expectedHtmlPath, "utf-8").trim();
          expect(clipboardContent?.htmlText).toBe(expectedHtml);
        } else {
          throw new Error(`Expected HTML fixture not found at path: ${expectedHtmlPath}`);
        }
      });
    }
  }
});
