/**
 * This declaration file extends NodeJS's built-in ProcessEnv interface
 * to include custom environment variables used in the project.
 *
 * It enables TypeScript to recognize and type-check environment variables
 * like `process.env.PLAYWRIGHT_BASE_URL`.
 */

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * Base URL for Playwright tests.
     * Can be set in CI or locally to override the default (e.g. http://localhost:4200).
     */
    PLAYWRIGHT_BASE_URL?: string;

    // Add more custom environment variables below as needed.
  }
}
