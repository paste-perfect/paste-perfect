import prismComponents from "prismjs/components.js";
import { getEntries } from "@utils/utils";
import { LanguageDefinition } from "@types";
import { PRETTIER_LANGUAGE_MAP } from "./prettier-language-map";
import { normalizeToArray } from "@utils/languages-utils";

/**
 * Set of commonly used programming languages.
 * These languages are considered "popular" and can be adjusted as needed.
 */
const POPULAR_LANGUAGES_SET = new Set([
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
 * Derive all supported languages from the Prism.js components language definition.
 * This creates an array of LanguageDefinition objects sorted alphabetically by title.
 *
 * The filtering step excludes the 'meta' entry, which contains metadata unrelated to actual languages.
 * The map function transforms each language entry into a LanguageDefinition object,
 * including their title, value, dependencies, and alias titles.
 * Additional custom languages (Angular, Vue) are appended before sorting.
 */
export const ALL_LANGUAGES: LanguageDefinition[] = [
  ...getEntries(prismComponents.languages)
    .filter(([key]): boolean => key !== "meta") // Exclude metadata entry
    .map(([key, value]) => {
      const prettierConfiguration = PRETTIER_LANGUAGE_MAP[key];
      const hasPrettierConfiguration = !!prettierConfiguration;
      return {
        // Use provided title, or fallback to key
        title: (value.title || key) + (hasPrettierConfiguration ? "*" : ""),
        // Language identifier
        value: key,
        // Extract alias titles
        filterAlias: Object.values((value.aliasTitles as Record<string, string>) || {}),
        prismConfiguration: {
          // Collect dependencies, ensuring they are arrays
          dependencies: [...normalizeToArray(value.require), ...normalizeToArray(value.modify), ...normalizeToArray(value.optional)],
        },
        // Add Prettier configuration if available
        prettierConfiguration: prettierConfiguration,
      };
    }),
  {
    title: "Angular",
    value: "angular",
    filterAlias: ["Angular", "Typescript"],
    prismConfiguration: {
      dependencies: ["typescript", "scss", "json", "markup"],
      customImportPath: "custom-languages/angular-grammar.js",
    },
    prettierConfiguration: PRETTIER_LANGUAGE_MAP["typescript"],
  },
  {
    title: "Vue",
    value: "vue",
    filterAlias: ["Vue", "Typescript"],
    prismConfiguration: {
      dependencies: ["typescript", "scss", "json", "markup"],
      customImportPath: "custom-languages/vue-grammar.js",
    },
    prettierConfiguration: PRETTIER_LANGUAGE_MAP["html"],
  },
].sort((a, b) => a.title.localeCompare(b.title));

export const POPULAR_LANGUAGES = ALL_LANGUAGES.filter((lang) => POPULAR_LANGUAGES_SET.has(lang.value));

export const OTHER_LANGUAGES = ALL_LANGUAGES.filter((lang) => !POPULAR_LANGUAGES_SET.has(lang.value));
