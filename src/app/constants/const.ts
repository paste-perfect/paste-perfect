import { TooltipOptions } from "primeng/api";

/**
 * Default tooltip options for the application.
 */
export const DEFAULT_TOOLTIP_OPTIONS: TooltipOptions = {
  showDelay: 500,
};

/**
 * Local storage key used to save editor settings.
 */
export const SETTINGS_STORAGE_KEY = "editor_settings";

/**
 * Local storage key used to save the selected language preference.
 */
export const LANGUAGE_STORAGE_KEY = "selected_language";

/**
 * Local storage key used to save the selected theme preference.
 */
export const THEME_STORAGE_KEY = "selected_theme";

/**
 * CSS selector for the parent `<pre>` element wrapping the highlighted code.
 */
export const HTML_CODE_PRE_SELECTOR = "pre#highlighted-code-wrapper";

/**
 * CSS selector for the `<code>` element containing the highlighted code.
 */
export const HTML_CODE_SELECTOR = "code.highlighted-code";

/**
 * Mapping of available indentation modes.
 */
export const INDENTATION_MODE_MAP = {
  Spaces: "spaces",
  Tabs: "tabs",
  NBSP: "nbsp",
} as const;
