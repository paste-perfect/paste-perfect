import { test } from "../pages/code-highlighter.page";
import { DarkTheme } from "@constants";

const MOBILE_VIEWPORT = { width: 600, height: 800 };
const THEME = DarkTheme.A11yDark;

test.describe("Mobile Settings Dialog", () => {
  test("opens, reflects a setting change, and closes the settings dialog", async ({ page }) => {
    // Arrange – switch to mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.locator("#configuration-card").waitFor({ state: "hidden" });

    // Assert – mobile layout is active
    await page.assertions.expectHasMobileSettings();
    await page.expectScreenshot("mobile-view-base.png");

    // Arrange – open the settings dialog
    await page.actions.openMobileSettingsPanel();

    // Assert – dialog is visible with correct heading
    await page.assertions.expectSettingsDialogVisible();
    await page.assertions.expectSettingsDialogContains("Highlighting Settings");
    await page.expectScreenshot("mobile-view-dialog.png");

    // Arrange – change a setting inside the dialog
    await page.actions.setTheme(THEME);

    // Assert – theme is reflected
    await page.assertions.expectTheme(THEME);
    await page.expectScreenshot("mobile-view-dialog-theme.png");

    // Arrange – close the dialog
    await page.actions.closeSettingsDialog();

    // Assert – dialog is gone
    await page.assertions.expectSettingsDialogHidden();
    await page.expectScreenshot("mobile-view-updated-theme.png");
  });
});
