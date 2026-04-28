import { LanguageDefinition } from "@types";
import { ALL_LANGUAGES } from "@constants";

/**
 * Search for a language by its title (case-insensitive).
 * Prioritizes title matches  over filterAlias matches.
 * @param languageTitle - The title to search for
 * @returns The LanguageDefinition if found, undefined otherwise
 */
export const searchLanguageByTitle = (languageTitle: string): LanguageDefinition | undefined => {
  const normalizedSearch = languageTitle.trim().toLowerCase();

  // 1. Prioritize exact title matches
  const titleMatch = ALL_LANGUAGES.find((lang) => lang.title.trim().toLowerCase() === normalizedSearch);

  if (titleMatch) return titleMatch;

  // 2. Fallback to filterAlias matches
  return ALL_LANGUAGES.find((lang) => lang.filterAlias.some((alias) => alias.toLowerCase() === normalizedSearch));
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
