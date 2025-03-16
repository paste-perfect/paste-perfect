import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { StorageService } from "./storage.service";
import { DARK_THEME_MAP, LIGHT_THEME_MAP, THEME_STORAGE_KEY } from "@const";
import {
  AvailableTheme,
  DarkThemes,
  LightThemes,
  ThemeKey,
  ThemeValue,
} from "@types";
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

  /** Retrieve all themes */
  public getAllThemes(): AvailableTheme[] {
    return [...this.getLightThemes(), ...this.getDarkThemes()];
  }

  /** Retrieves light themes */
  public getLightThemes(): AvailableTheme[] {
    return this.getThemes(LIGHT_THEME_MAP);
  }

  /** Retrieves dark themes */
  public getDarkThemes(): AvailableTheme[] {
    return this.getThemes(DARK_THEME_MAP);
  }

  /** Applies the selected theme by updating or creating the stylesheet link */
  private applyTheme(theme: AvailableTheme): void {
    let linkElement: HTMLLinkElement = document.getElementById(
      this.PRISM_STYLESHEET_ID
    ) as HTMLLinkElement;

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
  private loadInitialTheme(): AvailableTheme {
    const storedThemeValue: string =
      this.storageService.getItem<string>(THEME_STORAGE_KEY) || "";
    const allThemes: AvailableTheme[] = this.getAllThemes();
    return (
      allThemes.find(
        (theme: AvailableTheme): boolean => theme.value === storedThemeValue
      ) ?? allThemes[0]
    );
  }

  /**
   * Retrieves an array of available themes from the given theme map.
   *
   * @param themeMap - A mapping of theme keys to their respective values.
   * @returns An array of available themes, sorted alphabetically by label.
   */
  private getThemes(themeMap: LightThemes | DarkThemes): AvailableTheme[] {
    return getEntries(themeMap)
      .map(
        ([key, value]: [ThemeKey, ThemeValue]): AvailableTheme => ({
          label: key,
          value: value,
        })
      )
      .sort((a: AvailableTheme, b: AvailableTheme): number =>
        a.label.localeCompare(b.label)
      );
  }
}
