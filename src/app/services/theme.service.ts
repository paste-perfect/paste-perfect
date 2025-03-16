import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { StorageService } from "./storage.service";
import { THEME_MAP, THEME_STORAGE_KEY } from "@const";
import { AvailableTheme, ThemeKey, ThemeValue } from "@types";

/**
 * Service to manage application themes, including retrieving available themes,
 * persisting user selection, and applying themes dynamically.
 */
@Injectable({
  providedIn: "root",
})
export class ThemeService {
  /** Service for persisting the theme in localstorage */
  private storageService: StorageService = inject(StorageService);

  /** List of available themes */
  private readonly themes: AvailableTheme[] = Object.entries(THEME_MAP).map(
    ([label, value]) => ({
      label: label as ThemeKey,
      value: value as ThemeValue,
    })
  );

  constructor() {
    document.addEventListener(
      "DOMContentLoaded",
      () => this.applyTheme(this.selectedTheme),
      { once: true }
    );
  }

  /** Signal for the selected theme */
  private _selectedTheme: WritableSignal<AvailableTheme> = signal(
    this.loadInitialTheme()
  );

  /** Gets the currently selected theme */
  public get selectedTheme(): AvailableTheme {
    return this._selectedTheme();
  }

  /** Sets and persists the selected theme */
  public set selectedTheme(theme: AvailableTheme) {
    this.storageService.setItem(THEME_STORAGE_KEY, theme.value);
    this._selectedTheme.set(theme);
    this.applyTheme(theme);
  }

  /** Retrieves the list of available themes */
  public getAvailableThemes(): AvailableTheme[] {
    return [...this.themes]; // Return a copy to maintain immutability
  }

  /** Applies the selected theme by updating the stylesheet link */
  private applyTheme(theme: AvailableTheme): void {
    document
      .getElementById("prism-theme")
      ?.setAttribute("href", `prism-themes/${theme.value}.css`);
  }

  /** Loads the initial theme from storage or defaults to the first available theme */
  private loadInitialTheme(): AvailableTheme {
    const storedThemeValue =
      this.storageService.getItem<string>(THEME_STORAGE_KEY) || "";
    return (
      this.themes.find((theme) => theme.value === storedThemeValue) ??
      this.themes[0]
    );
  }
}
