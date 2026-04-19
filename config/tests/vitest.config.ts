import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["config/tests/vitest-setup.config.ts"],
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
