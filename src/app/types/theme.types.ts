import { DARK_THEME_MAP, LIGHT_THEME_MAP } from "@const";

/**
 * Represents a selectable syntax theme.
 */
export interface AvailableTheme {
  /** The key representing the theme label. */
  label: ThemeKey;
  /** The corresponding theme value. */
  value: ThemeValue;
}

/**
 * Type representing the key of a light theme from LIGHT_THEME_MAP.
 */
type LightThemeKey = keyof typeof LIGHT_THEME_MAP;

/**
 * Type representing the value of a light theme from LIGHT_THEME_MAP.
 */
type LightThemeValue = (typeof LIGHT_THEME_MAP)[LightThemeKey];

/**
 * Represents a collection of light themes, mapping their keys to their values.
 */
export type LightThemes = Record<LightThemeKey, LightThemeValue>;

/**
 * Type representing the key of a dark theme from DARK_THEME_MAP.
 */
type DarkThemeKey = keyof typeof DARK_THEME_MAP;

/**
 * Represents a collection of dark themes, mapping their keys to their values.
 */
export type DarkThemes = Record<DarkThemeKey, DarkThemeValue>;

/**
 * Type representing the value of a dark theme from DARK_THEME_MAP.
 */
type DarkThemeValue = (typeof DARK_THEME_MAP)[DarkThemeKey];

/**
 * Represents the key of a theme from either LIGHT_THEME_MAP or DARK_THEME_MAP.
 */
export type ThemeKey = LightThemeKey | DarkThemeKey;

/**
 * Represents the value of a theme from either LIGHT_THEME_MAP or DARK_THEME_MAP.
 */
export type ThemeValue = LightThemeValue | DarkThemeValue;
