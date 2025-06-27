import prismComponents from "prismjs/components.js";
import { getEntries } from "@utils/utils";
import { LanguageDefinition } from "@types";
import { PRETTIER_LANGUAGE_MAP } from "./prettier-language-map";

/**
 * Derive all supported languages from the Prism.js components language definition.
 * This maps each language key to a structured LanguageDefinition object.
 *
 * The filtering step excludes the 'meta' entry, which contains metadata unrelated to actual languages.
 * The reduce function constructs an object mapping language keys to their definitions,
 * including their title, value, dependencies, and alias titles.
 */
export const ALL_LANGUAGES_MAP: Record<string, LanguageDefinition> = {
  ...getEntries(prismComponents.languages)
    .filter(([key]): boolean => key !== "meta") // Exclude metadata entry
    .reduce((acc: Record<string, LanguageDefinition>, [key, value]) => {
      acc[key] = {
        // Use provided title, or fallback to key
        title: value.title || key,
        // Language identifier
        value: key,
        // Extract alias titles
        filterAlias: Object.values(value.aliasTitles || {}),
        prismConfiguration: {
          // Collect dependencies, ensuring they are arrays
          dependencies: [...normalizeToArray(value.require), ...normalizeToArray(value.modify), ...normalizeToArray(value.optional)],
        },
        // Add Prettier configuration if available
        prettierConfiguration: PRETTIER_LANGUAGE_MAP[key],
      };
      return acc;
    }, {}),
  angular: {
    title: "Angular",
    value: "angular",
    filterAlias: ["Angular", "Typescript"],
    prismConfiguration: {
      dependencies: ["typescript", "scss", "json", "markup"],
      customImportPath: "custom-languages/angular-grammar.js",
    },
    prettierConfiguration: { parser: "typescript", plugins: ["typescript", "estree"] },
  },
  vue: {
    title: "Vue",
    value: "vue",
    filterAlias: ["Vue", "Typescript"],
    prismConfiguration: {
      dependencies: ["typescript", "scss", "json", "markup"],
      customImportPath: "custom-languages/vue-grammar.js",
    },
    prettierConfiguration: { parser: "html", plugins: ["html"] },
  },
} as const;

/**
 * Set of commonly used programming languages.
 * These languages are considered "popular" and can be adjusted as needed.
 */
export const POPULAR_LANGUAGES = new Set([
  "csharp",
  "css",
  "java",
  "javascript",
  "json",
  "markup",
  "php",
  "python",
  "rust",
  "sql",
  "typescript",
  "yaml",
]);

/**
 * Normalize dependencies to always be an array.
 * If the input is a string, wrap it in an array.
 * If it's already an array, return it as is.
 * If undefined or any other type, return an empty array.
 */
function normalizeToArray(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return [];
}
