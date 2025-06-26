import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { StorageService } from "./storage.service";
import { DARK_THEME_MAP, LIGHT_THEME_MAP, THEME_STORAGE_KEY } from "@constants";
import { DarkThemes, LightThemes, SelectableTheme, Theme, ThemeLabel } from "@types";
import { getEntries } from "@utils/utils";
import { MessageService } from "primeng/api";

/**
 * Service to manage application themes, including retrieving available themes,
 * persisting user selection, and applying themes dynamically.
 */
@Injectable({
  providedIn: "root",
})
export class ThemeService {
  /** ID of the link-element where the prismjs stylesheet gets inserted */
  private readonly PRISM_STYLESHEET_ID: string = "prism-theme";

  /** Service for persisting the theme in localstorage */
  private storageService: StorageService = inject(StorageService);

  /** PrimeNGs messages service for displaying toasts to the user   */
  private messageService: MessageService = inject(MessageService);

  /** Signal for the selected theme */
  private _selectedTheme: WritableSignal<SelectableTheme> = signal(this.loadInitialTheme());

  constructor() {
    document.addEventListener("DOMContentLoaded", () => this.applyTheme(this.selectedTheme), { once: true });
  }

  /** Gets the currently selected theme */
  public get selectedTheme(): SelectableTheme {
    return this._selectedTheme();
  }

  /** Sets and persists the selected theme */
  public set selectedTheme(theme: SelectableTheme) {
    this.storageService.setItem(THEME_STORAGE_KEY, theme.value);
    this._selectedTheme.set(theme);
    this.applyTheme(theme);
  }

  /** Retrieve all themes */
  public getAllThemes(): SelectableTheme[] {
    return [...this.getLightThemes(), ...this.getDarkThemes()];
  }

  /** Retrieves light themes */
  public getLightThemes(): SelectableTheme[] {
    return this.getThemes(LIGHT_THEME_MAP);
  }

  /** Retrieves dark themes */
  public getDarkThemes(): SelectableTheme[] {
    return this.getThemes(DARK_THEME_MAP);
  }

  /** Applies the selected theme by updating or creating the stylesheet link */
  private applyTheme(theme: SelectableTheme): void {
    let linkElement: HTMLLinkElement = document.getElementById(this.PRISM_STYLESHEET_ID) as HTMLLinkElement;

    if (!linkElement) {
      // Create the link element if it does not exist
      linkElement = document.createElement("link");
      linkElement.id = this.PRISM_STYLESHEET_ID;
      linkElement.rel = "stylesheet";
      document.head.appendChild(linkElement);
    }

    // Set the href to apply the theme
    linkElement.href = `prism-themes/${theme.value}.css`;

    // Handle error in case the stylesheet fails to load
    linkElement.onerror = () => {
      this.messageService.add({
        severity: "error",
        summary: "Theme Load Failed",
        detail: `Failed to load theme: ${theme.value}`,
      });
      console.error(`Failed to load theme: ${theme.value}`);
    };
  }

  /** Loads the initial theme from storage or defaults to the first available theme */
  private loadInitialTheme(): SelectableTheme {
    const storedThemeValue: string = this.storageService.getItem<string>(THEME_STORAGE_KEY) || "";
    const allThemes: SelectableTheme[] = this.getAllThemes();
    return allThemes.find((theme: SelectableTheme): boolean => theme.value === storedThemeValue) ?? allThemes[0];
  }

  /**
   * Retrieves an array of available themes from the given theme map.
   *
   * @param themeMap - A mapping of theme keys to their respective values.
   * @returns An array of available themes, sorted alphabetically by label.
   */
  private getThemes(themeMap: LightThemes | DarkThemes): SelectableTheme[] {
    return getEntries(themeMap)
      .map(
        ([value, label]: [Theme, ThemeLabel]): SelectableTheme => ({
          value,
          label,
        })
      )
      .sort((a: SelectableTheme, b: SelectableTheme): number => a.label.localeCompare(b.label));
  }
}
