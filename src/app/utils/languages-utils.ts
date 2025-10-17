import { LanguageDefinition } from "@types";
import { ALL_LANGUAGES } from "../constants";

/**
 * Search for a language by its title (case-insensitive)
 * @param languageTitle - The title to search for
 * @returns The LanguageDefinition if found, undefined otherwise
 */
export const searchLanguageByTitle = (languageTitle: string): LanguageDefinition | undefined => {
  const normalizedTitle = languageTitle.toLowerCase().trim();

  return ALL_LANGUAGES.find(
    (language) =>
      language.title.toLowerCase() === normalizedTitle || language.filterAlias.some((alias) => alias.toLowerCase() === normalizedTitle)
  );
};

/**
 * Search for a language by its value/key (case-insensitive)
 * @param languageValue - The value/key to search for
 * @returns The LanguageDefinition if found, undefined otherwise
 */
export const searchLanguageByValue = (languageValue: string): LanguageDefinition | undefined => {
  const normalizedValue = languageValue.toLowerCase().trim();

  return ALL_LANGUAGES.find((language) => language.value.toLowerCase() === normalizedValue);
};

/**
 * Normalize Prism dependencies to always be an array.
 * If the input is a string, wrap it in an array.
 * If it's already an array, return it as is.
 * If undefined or any other type, return an empty array.
 */
export function normalizeToArray(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return [];
}
