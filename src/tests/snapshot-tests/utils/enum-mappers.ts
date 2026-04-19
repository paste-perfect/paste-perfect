import { DARK_THEME_MAP, DarkTheme, INDENTATION_MODE_MAP, IndentationMode, LIGHT_THEME_MAP, LightTheme } from "@constants";
import { IndentationModeLabel, Theme, ThemeLabel } from "@types";

/** Looks up the indentation label for a given indentation mode */
export const getIndentationValueFromMode = (mode: IndentationMode): IndentationModeLabel => {
  return INDENTATION_MODE_MAP[mode];
};

/** Looks up the theme label for a given theme */
export const getThemeValueFromTheme = (theme: Theme): ThemeLabel => {
  if (theme in LIGHT_THEME_MAP) {
    return LIGHT_THEME_MAP[theme as LightTheme];
  } else if (theme in DARK_THEME_MAP) {
    return DARK_THEME_MAP[theme as DarkTheme];
  }
  throw new Error(`Invalid theme: ${theme}`);
};
