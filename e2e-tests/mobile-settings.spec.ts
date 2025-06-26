import { test } from "./pages/code-highlighter.page";
import { Theme } from "@types";
import { DarkTheme } from "@constants";

test.describe("Mobile Settings Dialog", () => {
  test("should open and close settings dialog on small screen", async ({ page }) => {
    const theme: Theme = DarkTheme.A11yDark;

    // Simulate a small screen (e.g., width < breakpoint-md)
    await page.setViewportSize({ width: 600, height: 800 });

    await page.waitForTimeout(9999);

    // Verify we see the mobile version of settings
    await page.assertions.expectHasMobileSettings();

    await page.expectScreenshot("mobile-view-base.png");

    // Open the mobile settings dialog
    await page.actions.openMobileSettings();
    await page.assertions.expectSettingsDialogVisible();
    await page.assertions.expectSettingsDialogContains("Highlighting Settings");
    await page.expectScreenshot("mobile-view-dialog.png");

    // Interact with a setting inside the dialog (e.g., change theme)
    await page.actions.setTheme(theme);
    await page.assertions.expectTheme(theme);
    await page.expectScreenshot("mobile-view-dialog-theme.png");

    // Close the dialog
    await page.actions.closeSettingsDialog();
    await page.assertions.expectSettingsDialogHidden();
    await page.expectScreenshot("mobile-view-updated-theme.png");
  });
});
