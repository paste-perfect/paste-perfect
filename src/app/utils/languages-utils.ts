import { LanguageDefinition } from "@types";
import { ALL_LANGUAGES, HAS_PRETTIER_CONFIG_MARKER } from "@constants";

// Helper to normalize stored titles by removing the marker if it exists
const getNormalizedTitle = (language: LanguageDefinition) => {
  const { title, prettierConfiguration } = language;

  if (!!prettierConfiguration && title.endsWith(HAS_PRETTIER_CONFIG_MARKER)) {
    // Dynamically slice based on the marker's length
    return title.slice(0, -HAS_PRETTIER_CONFIG_MARKER.length).toLowerCase();
  }

  return title.toLowerCase();
};

/**
 * Removes the Prettier configuration marker from a title string if present.
 */
const normalizeTitleMarker = (title: string): string => {
  if (title.endsWith(HAS_PRETTIER_CONFIG_MARKER)) {
    return title.slice(0, -HAS_PRETTIER_CONFIG_MARKER.length).toLowerCase();
  }

  return title.toLowerCase();
};

/**
 * Search for a language by its title (case-insensitive).
 * Prioritizes title matches (ignoring trailing "*") over filterAlias matches.
 * @param languageTitle - The title to search for
 * @returns The LanguageDefinition if found, undefined otherwise
 */
export const searchLanguageByTitle = (languageTitle: string): LanguageDefinition | undefined => {
  const normalizedSearch = normalizeTitleMarker(languageTitle);

  // 1. Prioritize exact title matches
  const titleMatch = ALL_LANGUAGES.find((lang) => getNormalizedTitle(lang) === normalizedSearch);

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
