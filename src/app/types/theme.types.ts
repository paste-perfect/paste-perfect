import { THEME_MAP } from "@const";

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
 * Represents the key of a theme from the THEME_MAP object.
 */
export type ThemeKey = keyof typeof THEME_MAP;

/**
 * Represents the value of a theme from the THEME_MAP object.
 */
export type ThemeValue = (typeof THEME_MAP)[ThemeKey];
