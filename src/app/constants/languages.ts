import prismComponents from "prismjs/components.js";
import { getEntries } from "@utils/utils";
import { LanguageDefinition } from "@types";

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
        // Collect dependencies, ensuring they are arrays
        dependencies: [...normalizeToArray(value.require), ...normalizeToArray(value.modify), ...normalizeToArray(value.optional)],
        // Extract alias titles
        filterAlias: Object.values(value.aliasTitles || {}),
      };
      return acc;
    }, {}),
  angular: {
    title: "Angular",
    value: "angular",
    dependencies: ["typescript", "scss", "json", "markup"],
    filterAlias: ["Angular", "Typescript"],
    customImportPath: "custom-languages/angular-grammar.js",
  },
  vue: {
    title: "Vue",
    value: "vue",
    dependencies: ["typescript", "scss", "json", "markup"],
    filterAlias: ["Vue", "Typescript"],
    customImportPath: "custom-languages/vue-grammar.js",
  },
};

/**
 * Set of commonly used programming languages.
 * These languages are considered "popular" and can be adjusted as needed.
 */
export const POPULAR_LANGUAGES = new Set([
  "java",
  "javascript",
  "typescript",
  "markup",
  "css",
  "python",
  "csharp",
  "php",
  "rust",
  "sql",
  "json",
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
