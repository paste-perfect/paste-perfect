import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { StorageService } from "./storage.service";
import { HighlightingSettings, SelectableIndentationMode } from "@types";
import { INDENTATION_MODE_MAP, IndentationMode, SETTINGS_STORAGE_KEY } from "@constants";
import { getEntries } from "@utils/utils";

/**
 * Service to manage editor settings, including indentation size and mode,
 * persisting user selections, and providing an interface for settings changes.
 */
@Injectable({
  providedIn: "root",
})
export class SettingsService {
  /** Service for persisting the settings in localstorage */
  private storageService: StorageService = inject(StorageService);

  /** List of available languages */
  private readonly indentationModes: SelectableIndentationMode[] = getEntries(INDENTATION_MODE_MAP).map(([value, label]) => ({
    value: value,
    label: label,
  }));

  /** Signal for the editor settings */
  private _editorSettings: WritableSignal<HighlightingSettings> = signal(this.loadInitialSettings());

  /** Gets the current editor settings */
  public get editorSettings(): HighlightingSettings {
    return this._editorSettings();
  }

  /** Updates and persists the editor settings */
  public updateSettings(settings: Partial<HighlightingSettings>): void {
    const updatedSettings = { ...this._editorSettings(), ...settings };
    this.storageService.setItem(SETTINGS_STORAGE_KEY, updatedSettings);
    this._editorSettings.set(updatedSettings);
  }

  /** Retrieves the list of available languages */
  public getAvailableIndentationModes(): SelectableIndentationMode[] {
    return [...this.indentationModes]; // Return a copy to maintain immutability
  }

  /** Loads the initial settings from storage or defaults */
  private loadInitialSettings(): HighlightingSettings {
    return {
      indentationSize: 2,
      indentationMode: IndentationMode.Spaces,
      enableFormatting: true,
      // Overwrite defaults with stored values if they exist
      ...(this.storageService.getItem<HighlightingSettings>(SETTINGS_STORAGE_KEY) || {}),
    };
  }
}
