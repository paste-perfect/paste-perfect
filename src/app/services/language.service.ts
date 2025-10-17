import { computed, inject, Injectable, signal, WritableSignal } from "@angular/core";
import { StorageService } from "./storage.service";
import { LanguageDefinition } from "@types";
import { LANGUAGE_STORAGE_KEY, POPULAR_LANGUAGES, searchLanguageByValue } from "@constants";

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

  /** Signal for the selected language */
  private _selectedLanguage: WritableSignal<LanguageDefinition> = signal(this.loadInitialLanguage());

  /** Gets the currently selected language value */
  public get selectedLanguageValue(): string {
    return this._selectedLanguage().value;
  }

  /** Sets and persists the selected language by value */
  public set selectedLanguageValue(languageValue: string) {
    this.storageService.setItem(LANGUAGE_STORAGE_KEY, languageValue);

    // Find the language definition that matches this value
    const languageDefinition = searchLanguageByValue(languageValue);
    if (languageDefinition) {
      this._selectedLanguage.set(languageDefinition);
    }
  }

  /**
   * Whether the currently selected language supports formatting / prettier
   */
  public readonly isPrettierSupportedByLanguage = computed(() => !!this.selectedLanguage.prettierConfiguration);

  /** Gets the full language definition object */
  public get selectedLanguage(): LanguageDefinition {
    return this._selectedLanguage();
  }

  /** Loads the initial language from storage or defaults to the first available language */
  private loadInitialLanguage(): LanguageDefinition {
    const storedLanguageValue = this.storageService.getItem<string>(LANGUAGE_STORAGE_KEY) || "";
    return searchLanguageByValue(storedLanguageValue) ?? POPULAR_LANGUAGES[0];
  }
}
