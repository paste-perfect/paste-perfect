import { TooltipOptions } from "@openng/optimus-ui/api";

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
 * Session storage key used to save copy-to-clipboard settings.
 */
export const COPY_SETTINGS_STORAGE_KEY = "copy_settings";

/**
 * CSS selector for the parent `<pre>` element wrapping the highlighted code.
 */
export const HTML_CODE_PRE_SELECTOR = "pre#highlighted-code-wrapper";

/**
 * Input length (in characters) from which code is only reprocessed once typing pauses.
 * Smaller inputs are processed on every change.
 */
export const LARGE_INPUT_LENGTH = 20_000;

/**
 * Typing pause (in ms) after which a large input is reprocessed.
 */
export const LARGE_INPUT_DEBOUNCE_MS = 250;

export enum IndentationMode {
  Spaces = "SPACE_INDENTATION",
  Tabs = "TAB_INDENTATION",
}

/**
 * Mapping of available indentation modes.
 */
export const INDENTATION_MODE_MAP: Record<IndentationMode, string> = {
  [IndentationMode.Spaces]: "Spaces",
  [IndentationMode.Tabs]: "Tabs",
} as const;
