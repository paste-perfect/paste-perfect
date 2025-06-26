import { LanguageDefinition } from "@types";
import { ALL_LANGUAGES_MAP } from "@constants";
import { MessageService } from "primeng/api";
import { inject, Injectable } from "@angular/core";
import * as Prism from "prismjs";
import { LocationStrategy } from "@angular/common";

@Injectable({
  providedIn: "root",
})
export class PrismLanguageLoaderService {
  /**
   * PrimeNGs messages service for displaying toasts to the user
   */
  private messageService: MessageService = inject(MessageService);

  /**
   * Inject location strategy to get the base href configured in angular.json
   */
  private locationStrategy: LocationStrategy = inject(LocationStrategy);

  /**
   * Dynamically loads the Prism.js language component for the given language.
   *
   * @param language - The language identifier (e.g., 'typescript', 'python', 'java').
   * @returns A Promise that resolves when the language is successfully loaded or rejects on failure.
   */
  public async loadPrismLanguage(language: LanguageDefinition): Promise<void> {
    if (!language?.value || Prism.languages[language.value]) {
      return; // Language already loaded or invalid
    }

    try {
      await this.loadDependencies(language);

      await this.importLanguage(language);
    } catch (error) {
      console.error(`Failed to load PrismJS language: ${language.value}`, error);
      this.messageService.add({
        severity: "error",
        summary: "Language loading failed",
        detail: `Could not load syntax highlighting for "${language.value}". Please check if the language is supported.`,
      });
    }
  }

  /**
   * Recursively loads dependencies before loading the main language.
   *
   * @param lang - The language definition.
   */
  private async loadDependencies(lang: LanguageDefinition): Promise<void> {
    if (!lang?.prismConfiguration.dependencies?.length) return;

    for (const dep of lang.prismConfiguration.dependencies) {
      const dependency = ALL_LANGUAGES_MAP[dep];

      if (!dependency) {
        const warningMessage = `Dependency "${dep}" not found in ALL_LANGUAGES_MAP.`;
        console.warn(warningMessage);

        this.messageService.add({
          severity: "warn",
          summary: "Missing Dependency",
          detail: `The dependency "${dep}" for language "${lang.value}" could not be found. Some features might not work correctly.`,
        });

        continue;
      }

      if (!Prism.languages[dependency.value]) {
        // First import all required dependencies
        await this.loadDependencies(dependency);
        // Then import the actual language
        await this.importLanguage(dependency);
      }
    }
  }

  /**
   * Dynamically imports a Prism.js language module.
   *
   * @param lang - The language definition.
   */
  private async importLanguage(lang: LanguageDefinition): Promise<void> {
    try {
      if (lang.prismConfiguration.customImportPath) {
        await import(/* @vite-ignore */ `${this.locationStrategy.getBaseHref()}${lang.prismConfiguration.customImportPath}`);
      } else {
        await import(/* @vite-ignore */ `../../../../node_modules/prismjs/components/prism-${lang.value}.min.js`);
      }
      // Note: The following import method does not work for some reason
      // await import( /* @vite-ignore */  prismjs/components/prism-${lang}.min.js);
    } catch (error) {
      const errorMessage = `Error importing PrismJS language module: ${lang.value}`;
      console.error(errorMessage, error);

      this.messageService.add({
        severity: "error",
        summary: "Language Import Error",
        detail: `Could not load the module for "${lang.value}".`,
      });

      throw error; // Propagate error to the calling function
    }
  }
}
