import { test, expect } from "@playwright/test";

const sampleCode = `function helloWorld() {\n  console.log("Hello, world!");\n}`;

test.describe("Code Highlighter E2E Smoke", () => {
  test.beforeEach(async ({ page }) => {
    // Override the font to have Arial as default (for cross-browser comparison)
    await page.addStyleTag({
      content: `
      :root {
        --font-family: 'Arial', sans-serif !important;
      }
    `,
    });
    await page.goto("/");
  });

  test("should update highlighted output when code is entered", async ({ page }) => {
    const input = page.locator("#source-code");
    const output = page.locator("#highlighted-code-wrapper code");

    await input.fill(sampleCode);

    // Wait for async highlight
    await expect(output).toContainText(sampleCode);

    // Screenshot Testing
    await expect(page).toHaveScreenshot("smoke-highlighted-output-fullpage.png", {
      fullPage: true,
    });
  });
});
