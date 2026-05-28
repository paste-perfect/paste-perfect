import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { CopyMode, CopySettingChip, CopySettings, DEFAULT_COPY_SETTINGS } from "@types";
import { StorageService } from "./storage.service";
import { COPY_SETTINGS_STORAGE_KEY } from "@constants/const";

/**
 * Service managing copy-to-clipboard settings.
 *
 * Settings are persisted to sessionStorage so they survive within a single
 * browser tab session but reset between sessions (closing the tab/window).
 */
@Injectable({
  providedIn: "root",
})
export class CopySettingsService {
  /** Service for persisting the copy settings in sessionStorage. */
  private readonly storageService: StorageService = inject(StorageService);

  /** Signal for the copy settings, kept in sync with sessionStorage. */
  private readonly _settings: WritableSignal<CopySettings> = signal(this.loadInitialSettings());

  /** Returns the current copy settings snapshot. */
  get copySettings(): CopySettings {
    return this._settings();
  }

  /** Applies a partial update to the copy settings and persists the result. */
  updateSettings(partial: Partial<CopySettings>): void {
    const updated = { ...this._settings(), ...partial };
    this.storageService.setSessionItem(COPY_SETTINGS_STORAGE_KEY, updated);
    this._settings.set(updated);
  }

  /** Resets all copy settings back to their factory defaults and persists the result. */
  resetToDefaults(): void {
    this.storageService.setSessionItem(COPY_SETTINGS_STORAGE_KEY, DEFAULT_COPY_SETTINGS);
    this._settings.set({ ...DEFAULT_COPY_SETTINGS });
  }

  /** Resets a single copy setting back to its factory default and persists the result. */
  resetSetting<K extends keyof CopySettings>(key: K): void {
    this.updateSettings({ [key]: DEFAULT_COPY_SETTINGS[key] } as Partial<CopySettings>);
  }

  /** Loads the initial settings from sessionStorage or falls back to defaults. */
  private loadInitialSettings(): CopySettings {
    return {
      ...DEFAULT_COPY_SETTINGS,
      ...(this.storageService.getSessionItem<CopySettings>(COPY_SETTINGS_STORAGE_KEY) || {}),
    };
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
      s.officeTabSizeCm !== d.officeTabSizeCm ||
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
    if (s.officeTabSizeCm !== DEFAULT_COPY_SETTINGS.officeTabSizeCm) {
      chips.push({ label: `Office Tab: ${s.officeTabSizeCm}cm`, key: "officeTabSizeCm" });
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
