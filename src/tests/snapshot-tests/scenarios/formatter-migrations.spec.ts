import { test, expect } from "../pages/code-highlighter.page";

for (const sample of [
  {
    language: "Java",
    source: "class Example{public static void main(String[] args){System.out.println(42);}}",
    expected: "class Example {",
  },
  { language: "nginx", source: "server{listen 80;location /{return 200;}}", expected: "server {" },
  { language: "SQL", source: "select name from users where id=1;", expected: "users" },
]) {
  test(`formats ${sample.language} in the browser`, async ({ page }) => {
    await page.actions.setLanguage(sample.language);
    await page.actions.setEnableFormatting(true);
    await page.actions.inputSourceCode(sample.source, true);
    const output = page.locator("#highlighted-code-wrapper code");
    await expect(output).toContainText(sample.expected, { timeout: 30_000 });
    await expect(output).not.toHaveText(sample.source);
    await expect(page.locator("textarea")).toHaveClass(/formatting-valid/);
  });
}
