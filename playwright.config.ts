import { defineConfig, devices } from "@playwright/test";

const HEADLESS = true;
export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4200/paste-perfect/";

export default defineConfig({
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        baseURL: BASE_URL,
        headless: process.env.CI ? true : HEADLESS, // always headless in CI
        launchOptions: {
          args: [
            "--disable-lcd-text",
            "--font-rendering-hinting=none",
            "--disable-gpu", // Disables GPU hardware acceleration. If software renderer is not in place, then the GPU process won't launch.
            "--disable-gpu-rasterization", // Disable GPU rasterization, i.e. rasterize on the CPU only. Overrides the kEnableGpuRasterization flag.
            "--disable-gpu-compositing", // Prevent the compositor from using its GPU implementation.
            "--disable-font-subpixel-positioning", // Force disables font subpixel positioning. This affects the character glyph sharpness, kerning, hinting and layout.
            "--disable-software-rasterizer", // Disables the use of a 3D software rasterizer. (Necessary to make --disable-gpu work)
            "--ppapi-subpixel-rendering-setting=0", // The enum value of FontRenderParams::subpixel_rendering to be passed to Ppapi processes.
            "--force-device-scale-factor=1", // Overrides the device scale factor for the browser UI and the contents.
            "--force-color-profile=srgb", // Force all monitors to be treated as though they have the specified color profile.
            "--disable-system-font-check", // Disable system font check to prevent fallback fonts
            "--disable-font-subpixel-positioning", // Ensure consistent font positioning
            "--disable-features=VizDisplayCompositor", // Disable compositor features that might affect rendering
            "--use-gl=swiftshader", // Use software rendering for consistent results
            "--disable-background-timer-throttling", // Prevent timing differences
            "--disable-renderer-backgrounding", // Keep renderer active
            "--disable-backgrounding-occluded-windows", // Prevent background optimizations
            "--disable-ipc-flooding-protection", // Disable IPC protection that might affect timing
            "--font-render-hinting=none", // Disable font hinting
            "--enable-font-antialiasing", // Ensure antialiasing is consistent
            "--force-prefers-reduced-motion", // Disable animations that might affect screenshots
          ],
        },
        viewport: {
          width: 1280,
          height: 720,
        },
        deviceScaleFactor: 1, // no retina / high-DPI differences
        locale: "en-US", // Force consistent locale
        timezoneId: "UTC", // Force consistent timezone
      },
    },
  ],
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  reporter: [
    ["junit", { outputFile: "reports/playwright/report.xml" }],
    ["github"],
    ["list"],
    ["html", { outputFolder: "reports/playwright/html-report" }],
  ],
  retries: 0,
  testDir: "snapshot-tests",
  snapshotPathTemplate: "{testDir}/snapshots/{testFileName}/{arg}{ext}",
  use: {
    trace: "on-first-retry",
    launchOptions: {
      timeout: 120 * 1000, // 2 mins
    },
    actionTimeout: 5 * 1000, // 5 seconds for actions (i.e., click, goto)
  },
  webServer: {
    command: "npm run serve:test",
    reuseExistingServer: !process.env.CI,
    url: BASE_URL,
  },
  workers: process.env.CI ? 1 : undefined,
});
