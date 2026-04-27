import { expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { test } from "../pages/code-highlighter.page";
import { HighlightingSettings, Theme } from "@types";
import { DarkTheme, IndentationMode, LightTheme } from "@constants";

const TEST_DATA_DIR = path.join(__dirname, "../test-data");

interface RenderMode extends HighlightingSettings {
  name: string;
  theme: Theme;
  fixtureDir: string;
}

interface TestCase {
  language: string;
  rawFilename: string;
  fixtureFilename: string;
}

const TEST_CASES: TestCase[] = [
  { language: "JavaScript", rawFilename: "javascript.js", fixtureFilename: "javascript.html" },
  { language: "Python", rawFilename: "python.py", fixtureFilename: "python.html" },
  { language: "Markup", rawFilename: "markup.html", fixtureFilename: "markup.html" },
];

const RENDER_MODES: RenderMode[] = [
  {
    name: "Dark Mode with Tabs",
    theme: DarkTheme.PrismColdarkDark,
    indentationMode: IndentationMode.Tabs,
    indentationSize: 2,
    fixtureDir: "dark-tabs",
    enableFormatting: false,
    showLineNumbers: true,
  },
  {
    name: "Light Mode with Spaces",
    theme: LightTheme.A11yLight,
    indentationMode: IndentationMode.Spaces,
    indentationSize: 4,
    fixtureDir: "light-spaces",
    enableFormatting: false,
    showLineNumbers: false,
  },
];

for (const mode of RENDER_MODES) {
  for (const { language, rawFilename, fixtureFilename } of TEST_CASES) {
    const slug = `${language.toLowerCase().replace(/\s+/g, "-")}-${mode.fixtureDir}`;
    const rawCodePath = path.join(TEST_DATA_DIR, "raw", rawFilename);

    const editorSettings = {
      ...mode,
      language,
    };

    test.describe(`${language} – ${mode.name}`, () => {
      test(`renders syntax highlighting correctly [${slug}]`, async ({ page }) => {
        await page.assertions.expectHasDesktopSettings();

        // Arrange
        await page.utils.applyEditorWithFile({ ...editorSettings, filePath: rawCodePath });

        // Assert – settings
        await page.utils.assertEditorSettings(editorSettings);

        // Assert – highlighted output is visible
        await expect(page.locator("#highlighted-code-wrapper code")).toBeVisible();

        await page.expectScreenshot(`${slug}-fullpage.png`);
      });

      test(`copies correct plain text and HTML to clipboard [${slug}]`, async ({ page }) => {
        await page.assertions.expectHasDesktopSettings();

        // Arrange
        await page.utils.applyEditorWithFile({ ...editorSettings, filePath: rawCodePath });
        await page.actions.setupClipboardMocking();
        await page.actions.clickCopyToClipboardButton();

        // Assert – plain text matches visible output
        const expectedPlainText = (await page.utils.getHighlightedCodeText()).trim();
        const clipboard = await page.utils.getClipboardContent();

        expect(clipboard).not.toBeNull();
        expect(clipboard!.plainText).toBe(expectedPlainText);

        // Assert – HTML matches stored fixture
        const fixturePath = path.join(TEST_DATA_DIR, mode.fixtureDir, fixtureFilename);

        if (!fs.existsSync(fixturePath)) {
          throw new Error(`HTML fixture not found: ${fixturePath}`);
        }

        const expectedHtml = fs.readFileSync(fixturePath, "utf-8").trim();
        expect(clipboard!.htmlText).toBe(expectedHtml);
      });
    });
  }
}
