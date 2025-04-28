import { LanguageDefinition } from "@types";

/**
 * Mapping of language aliases to their Prettier configurations
 */
export const PRETTIER_LANGUAGE_MAP: Record<string, LanguageDefinition["prettier"]> = {
  // Angular
  angular: { parser: "angular", plugins: [] },

  // JavaScript and variants
  javascript: { parser: "babel", plugins: ["babel", "estree"] },
  js: { parser: "babel", plugins: ["babel", "estree"] },
  jsx: { parser: "babel", plugins: ["babel", "estree"] },

  // TypeScript and variants
  typescript: { parser: "typescript", plugins: ["typescript", "estree"] },
  ts: { parser: "typescript", plugins: ["typescript", "estree"] },
  tsx: { parser: "typescript", plugins: ["typescript", "estree"] },

  // Markup languages
  html: { parser: "html", plugins: ["html"] },
  xml: { parser: "html", plugins: ["html"] },
  svg: { parser: "html", plugins: ["html"] },
  markup: { parser: "html", plugins: ["html"] },

  // Styling languages
  css: { parser: "css", plugins: ["postcss"] },
  scss: { parser: "css", plugins: ["postcss"] },
  less: { parser: "css", plugins: ["postcss"] },

  // Data formats
  json: { parser: "json", plugins: ["estree"] },
  jsonc: { parser: "json", plugins: ["estree"] },

  // Documentation formats
  markdown: { parser: "markdown", plugins: ["markdown"] },
  md: { parser: "markdown", plugins: ["markdown"] },

  // Configuration formats
  yaml: { parser: "yaml", plugins: ["yaml"] },
  yml: { parser: "yaml", plugins: ["yaml"] },

  // GraphQL
  graphql: { parser: "graphql", plugins: ["graphql"] },
  gql: { parser: "graphql", plugins: ["graphql"] },

  // Java
  java: { parser: "java", plugins: ["java"], external: true },
};
