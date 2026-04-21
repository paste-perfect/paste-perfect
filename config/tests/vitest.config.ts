import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["config/tests/vitest-setup.config.ts"],
    environment: "happy-dom",
    environmentOptions: {
      happyDOM: {
        settings: {
          disableCSSFileLoading: true, // Prevents Happy DOM from fetching <link> stylesheets
        },
      },
    },
  },
  resolve: {
    alias: {
      "@components": "/src/app/components",
      "@constants": "/src/app/constants/index",
      "@package.json": "/package.json",
      "@services": "/src/app/services",
      "@types": "/src/app/types/index",
      "@utils": "/src/app/utils",
    },
  },
});
