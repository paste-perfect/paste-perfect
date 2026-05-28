import { test } from "../pages/code-highlighter.page";

test.describe("Copy Settings Dialog – Opens", () => {
  test("opens the copy settings dialog and renders consistently", async ({ page }) => {
    await page.assertions.expectHasDesktopSettings();
    await page.assertions.expectCopyButtonDisabled();

    // Act – open the copy settings dialog
    await page.actions.openCopySettingsDialog();

    // Assert – dialog is visible with expected content
    await page.assertions.expectCopySettingsDialogVisible();
    await page.assertions.expectCopySettingsDialogContains("Copy Settings");
    await page.assertions.expectCopySettingsDialogContains("Copy Mode");
    await page.assertions.expectCopySettingsDialogContains("Display Options");
    await page.assertions.expectCopySettingsDialogContains("Microsoft Office Optimizations");

    await page.expectScreenshot("copy-settings-dialog-default.png");
  });
});
