import { expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { test } from "../pages/code-highlighter.page";
import { HighlightingSettings, Theme } from "@types";
import { DarkTheme, IndentationMode, LightTheme } from "@constants";

interface Mode extends HighlightingSettings {
  name: string;
  theme: Theme;
  fixtureDir: string;
}

interface TestCase {
  language: string;
  rawFilename: string;
  fixture: string;
}

const testCases: TestCase[] = [
  {
    language: "JavaScript*",
    rawFilename: "javascript.js",
    fixture: "javascript.html",
  },
  {
    language: "Python",
    rawFilename: "python.py",
    fixture: "python.html",
  },
  {
    language: "Markup*",
    rawFilename: "markup.html",
    fixture: "markup.html",
  },
];

const modes: Mode[] = [
  {
    name: "Dark Mode with Tabs",
    theme: DarkTheme.PrismColdarkDark,
    indentationMode: IndentationMode.Tabs,
    indentationSize: 2,
    fixtureDir: "dark-tabs",
    enableFormatting: false,
  },
  {
    name: "Light Mode with Spaces",
    theme: LightTheme.A11yLight,
    indentationMode: IndentationMode.Spaces,
    indentationSize: 4,
    fixtureDir: "light-spaces",
    enableFormatting: false,
  },
];

const TEST_DATA_DIR = "../test-data";

for (const mode of modes) {
  for (const { language, rawFilename, fixture } of testCases) {
    const baseName = `${language.toLowerCase().replace(/\s+/g, "-")}-${mode.fixtureDir}`;

    test.describe(`${language} (${mode.name})`, () => {
      test(`should render syntax highlighting correctly [${baseName}]`, async ({ page }) => {
        // Ensure that we have the desktop view
        await page.assertions.expectHasDesktopSettings();
        const rawCodePath = path.join(__dirname, TEST_DATA_DIR, "raw", rawFilename);

        await page.utils.configureEditorFromFile({
          language,
          theme: mode.theme,
          indentationMode: mode.indentationMode,
          indentationSize: mode.indentationSize,
          enableFormatting: mode.enableFormatting,
          filePath: rawCodePath,
        });

        await page.expectScreenshot(`${baseName}-fullpage.png`);
      });

      test(`should copy correct plain and HTML content to clipboard [${baseName}]`, async ({ page }) => {
        // Ensure that we have the desktop view
        await page.assertions.expectHasDesktopSettings();

        const rawCodePath = path.join(__dirname, TEST_DATA_DIR, "raw", rawFilename);

        await page.utils.configureEditorFromFile({
          language,
          theme: mode.theme,
          indentationMode: mode.indentationMode,
          indentationSize: mode.indentationSize,
          enableFormatting: mode.enableFormatting,
          filePath: rawCodePath,
        });

        await page.actions.mockClipboardWrite();
        await page.actions.clickCopyButton();

        const clipboardContent = await page.utils.getClipboardContent();
        const expectedText = (await page.utils.getHighlightedCodeText()).trim();
        expect(clipboardContent?.plainText).toBe(expectedText);

        const expectedHtmlPath = path.join(__dirname, TEST_DATA_DIR, mode.fixtureDir, fixture);
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
