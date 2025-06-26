import { DARK_THEME_MAP, DarkTheme, LIGHT_THEME_MAP, LightTheme } from "@constants";

/**
 * Represents a selectable syntax theme.
 */
export interface SelectableTheme {
  /** The key representing the theme value. */
  readonly value: Theme;
  /** The corresponding theme label. */
  readonly label: ThemeLabel;
}

/**
 * Type representing the value of a light theme from LIGHT_THEME_MAP.
 */
type LightThemeLabel = (typeof LIGHT_THEME_MAP)[LightTheme];

/**
 * Represents a collection of light themes, mapping their keys to their values.
 */
export type LightThemes = Record<LightTheme, LightThemeLabel>;

/**
 * Represents a collection of dark themes, mapping their keys to their values.
 */
export type DarkThemes = Record<DarkTheme, DarkThemeLabel>;

/**
 * Type representing the value of a dark theme from DARK_THEME_MAP.
 */
type DarkThemeLabel = (typeof DARK_THEME_MAP)[DarkTheme];

/**
 * Represents the key of a theme from either LIGHT_THEME_MAP or DARK_THEME_MAP.
 */
export type Theme = LightTheme | DarkTheme;

/**
 * Represents the value of a theme from either LIGHT_THEME_MAP or DARK_THEME_MAP.
 */
export type ThemeLabel = LightThemeLabel | DarkThemeLabel;
