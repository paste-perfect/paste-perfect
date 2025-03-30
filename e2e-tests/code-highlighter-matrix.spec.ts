import { expect, Page, test } from "@playwright/test";
import fs from "fs";
import path from "path";

declare global {
  interface Window {
    // Add the clipboard item type for testing purposes only
    __copiedClipboardItem: ClipboardItem | null;
  }
}

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
async function setupEditor(page: Page, language: string, theme: string, indentMode: string, indentationSize: string, rawCodePath: string) {
  await page.goto("/");

  const code = fs.readFileSync(rawCodePath, "utf-8");

  await page.locator("#language-selector").click();
  await page.locator(`li span:text-is("${language}")`).click();

  await page.locator("#indentation-size").fill(indentationSize);
  await page.locator("#indent-mode").click();
  await page.locator(`li span:text-is("${indentMode}")`).click();

  await page.locator("#theme-selector").click();
  await page.locator(`li span:text-is("${theme}")`).click();

  await page.locator("#source-code").fill(code);
}

for (const mode of modes) {
  for (const { language, rawFilename, fixture } of testCases) {
    const baseName = `${language.toLowerCase().replace(/\s+/g, "-")}-${mode.fixtureDir}`;

    test.describe(`${language} (${mode.name})`, () => {
      test(`should render syntax highlighting correctly [${baseName}]`, async ({ page }) => {
        const rawCodePath = path.join(__dirname, FIXTURES_DIR, "raw", rawFilename);

        await setupEditor(page, language, mode.theme, mode.indentMode, mode.indentationSize, rawCodePath);

        await expect(page).toHaveScreenshot(`${baseName}-fullpage.png`, {
          fullPage: true,
        });
      });

      test(`should copy correct plain and HTML content to clipboard [${baseName}]`, async ({ page }) => {
        const rawCodePath = path.join(__dirname, FIXTURES_DIR, "raw", rawFilename);

        await setupEditor(page, language, mode.theme, mode.indentMode, mode.indentationSize, rawCodePath);

        const copyButton = page.locator("#copy-clipboard-button");
        const output = page.locator("#highlighted-code-wrapper code");

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
