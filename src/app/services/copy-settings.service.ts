import { Injectable, signal, WritableSignal } from "@angular/core";
import { CopyMode, CopySettingChip, CopySettings, DEFAULT_COPY_SETTINGS } from "@types";

/**
 * Service managing copy-to-clipboard settings.
 *
 * Unlike editor settings, copy settings are intentionally NOT persisted to localStorage.
 * They always start from their defaults on each page load.
 */
@Injectable({
  providedIn: "root",
})
export class CopySettingsService {
  /** In-memory signal for copy settings — never written to storage. */
  private readonly _settings: WritableSignal<CopySettings> = signal({ ...DEFAULT_COPY_SETTINGS });

  /** Returns the current copy settings snapshot. */
  get copySettings(): CopySettings {
    return this._settings();
  }

  /** Applies a partial update to the copy settings. */
  updateSettings(partial: Partial<CopySettings>): void {
    this._settings.set({ ...this._settings(), ...partial });
  }

  /** Resets all copy settings back to their factory defaults. */
  resetToDefaults(): void {
    this._settings.set({ ...DEFAULT_COPY_SETTINGS });
  }

  /** Returns true when the current copy mode is HTML (formatted). */
  isHtmlMode(): boolean {
    return this._settings().copyMode === CopyMode.HTML;
  }

  /** Returns true when any setting currently differs from the factory default. */
  hasNonDefaultSettings(): boolean {
    const s = this._settings();
    const d = DEFAULT_COPY_SETTINGS;
    return (
      s.copyMode !== d.copyMode ||
      s.fontSize !== d.fontSize ||
      s.tabSize !== d.tabSize ||
      s.inlineStylesForOffice !== d.inlineStylesForOffice ||
      s.adjustIndentationForOffice !== d.adjustIndentationForOffice
    );
  }

  /**
   * Returns chip descriptors for each setting that differs from the factory default.
   * Used by the result header to visually indicate active customisations.
   */
  getActiveChips(): CopySettingChip[] {
    const chips: CopySettingChip[] = [];
    const s = this._settings();

    if (s.copyMode === CopyMode.PlainText) {
      chips.push({ label: "Plain Text", key: "copyMode" });
    }
    if (s.fontSize !== DEFAULT_COPY_SETTINGS.fontSize) {
      chips.push({ label: `Font: ${s.fontSize}px`, key: "fontSize" });
    }
    if (s.tabSize !== DEFAULT_COPY_SETTINGS.tabSize) {
      chips.push({ label: `Tab: ${s.tabSize}`, key: "tabSize" });
    }
    if (!s.inlineStylesForOffice) {
      chips.push({ label: "No Office Styles", key: "inlineStylesForOffice" });
    }
    if (!s.adjustIndentationForOffice) {
      chips.push({ label: "No Office Indent", key: "adjustIndentationForOffice" });
    }

    return chips;
  }
}
