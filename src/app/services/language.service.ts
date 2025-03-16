import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { StorageService } from "./storage.service";
import { LanguageDefinition } from "@types";
import {
  ALL_LANGUAGES_MAP,
  LANGUAGE_STORAGE_KEY,
  POPULAR_LANGUAGES,
} from "@const";

/**
 * Service to manage application languages, including retrieving available languages,
 * persisting user selection, and providing an interface for language changes.
 */
@Injectable({
  providedIn: "root",
})
export class LanguageService {
  /** Service for persisting the language in localstorage */
  private storageService: StorageService = inject(StorageService);

  // /** List of available languages */
  // private readonly common_languages: AvailableLanguage[] = Object.entries(COMMON_LANGUAGES_MAP).map(([label, value]) => ({
  //   label: label as LanguageKey,
  //   value: value as LanguageValue
  // }));
  //
  // private readonly other_languages: AvailableLanguage[] = Object.entries(OTHER_LANGUAGE_MAP).map(([label, value]) => ({
  //   label: label as LanguageKey,
  //   value: value as LanguageValue
  // }));

  /** Signal for the selected language */
  private _selectedLanguage: WritableSignal<LanguageDefinition> = signal(
    this.loadInitialLanguage()
  );

  /** Gets the currently selected language */
  public get selectedLanguage(): LanguageDefinition {
    return this._selectedLanguage();
  }

  /** Sets and persists the selected language */
  public set selectedLanguage(language: LanguageDefinition) {
    this.storageService.setItem(LANGUAGE_STORAGE_KEY, language.value);
    this._selectedLanguage.set(language);
  }

  /** Retrieves all available languages, grouped by common and other */
  public getAllLanguages(): {
    common: LanguageDefinition[];
    other: LanguageDefinition[];
  } {
    return {
      common: this.getCommonLanguages(),
      other: this.getOtherLanguages(),
    };
  }

  /** Retrieves only common languages */
  public getCommonLanguages(): LanguageDefinition[] {
    return Object.values(ALL_LANGUAGES_MAP)
      .filter((lang) => POPULAR_LANGUAGES.has(lang.value))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  /** Retrieves only other languages */
  public getOtherLanguages(): LanguageDefinition[] {
    return Object.values(ALL_LANGUAGES_MAP)
      .filter((lang) => !POPULAR_LANGUAGES.has(lang.value))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  /** Loads the initial language from storage or defaults to the first available language */
  private loadInitialLanguage(): LanguageDefinition {
    const storedLanguageValue =
      this.storageService.getItem<string>(LANGUAGE_STORAGE_KEY) || "";
    return (
      ALL_LANGUAGES_MAP[storedLanguageValue] ?? this.getCommonLanguages()[0]
    );
  }
}
