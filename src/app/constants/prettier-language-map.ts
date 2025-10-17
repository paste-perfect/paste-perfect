import { PrettierLanguageConfiguration } from "@types";

/**
 * Mapping of language aliases to their Prettier configurations
 */
export const PRETTIER_LANGUAGE_MAP: Record<string, PrettierLanguageConfiguration> = {
  // Angular
  angular: { parser: "angular", plugins: [] },

  // Configuration formats
  toml: { parser: "toml", plugins: ["prettier-plugin-toml"] },
  yaml: { parser: "yaml", plugins: ["yaml"] },
  yml: { parser: "yaml", plugins: ["yaml"] },

  // Data formats
  json: { parser: "json", plugins: ["babel", "estree"] },
  jsonc: { parser: "json", plugins: ["babel", "estree"] },

  // Documentation formats
  markdown: { parser: "markdown", plugins: ["markdown"] },
  md: { parser: "markdown", plugins: ["markdown"] },

  // Gherkin
  gherkin: { parser: "gherkin", plugins: ["prettier-plugin-gherkin"] },

  // GraphQL
  graphql: { parser: "graphql", plugins: ["graphql"] },
  gql: { parser: "graphql", plugins: ["graphql"] },

  // Java
  java: { parser: "java", plugins: ["prettier-plugin-java"] },

  // JavaScript and variants
  javascript: { parser: "babel", plugins: ["babel", "estree"] },
  js: { parser: "babel", plugins: ["babel", "estree"] },
  jsx: { parser: "babel", plugins: ["babel", "estree"] },

  // Markup languages
  html: { parser: "html", plugins: ["html"] },
  markup: { parser: "html", plugins: ["html"] },
  svg: { parser: "html", plugins: ["html"] },
  xml: { parser: "html", plugins: ["html"] },

  // nginx
  nginx: { parser: "nginx", plugins: ["prettier-plugin-nginx"] },

  // sql
  sql: { parser: "sql", plugins: ["prettier-plugin-sql"] },

  // Styling languages
  css: { parser: "css", plugins: ["postcss"] },
  less: { parser: "css", plugins: ["postcss"] },
  scss: { parser: "css", plugins: ["postcss"] },

  // TypeScript and variants
  ts: { parser: "typescript", plugins: ["typescript", "estree"] },
  tsx: { parser: "typescript", plugins: ["typescript", "estree"] },
  typescript: { parser: "typescript", plugins: ["typescript", "estree"] },
} as const;
