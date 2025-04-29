import { inject, Injectable } from "@angular/core";
import { SettingsService } from "./settings.service";
import { PrettierPluginLoaderService } from "@services/prettier-plugin-loader.service";
import { LanguageDefinition } from "@types";
import * as prettier from "prettier/standalone";

/**
 * Service responsible for code formatting using Prettier
 */
@Injectable({
  providedIn: "root",
})
export class PrettierService {
  /** Service for loading Prettier plugins */
  private readonly pluginLoader = inject(PrettierPluginLoaderService);

  /** Service for accessing user settings */
  private readonly settingsService = inject(SettingsService);

  /**
   * Formats code using Prettier with appropriate plugins for the given language
   *
   * @param code - The source code to format
   * @param language - The programming language of the code
   * @returns A promise resolving to the formatted code, or the original code if formatting fails
   */
  public async formatCode(code: string, language: LanguageDefinition): Promise<string> {
    const settings = this.settingsService.editorSettings;

    // Return original code if formatting is disabled or code is empty
    if (!settings.enableFormatting || !code?.trim()) {
      return code;
    }

    try {
      // Get the appropriate parser and plugins for the language
      const result = await this.pluginLoader.getParserAndPlugins(language);

      // Output the original code if no prettier was found
      if (!result) {
        return code;
      }

      const { parser, plugins } = result;

      // Format the code with the appropriate parser and plugins
      return await prettier.format(code, {
        parser,
        plugins,
        // plugins: [tmpPlugin],
        printWidth: 140,
        tabWidth: settings.indentationSize,
        useTabs: settings.indentationMode === "tabs",
        semi: true,
        singleQuote: false,
        trailingComma: "es5",
        bracketSpacing: true,
        arrowParens: "always",
        endOfLine: "lf",
      });
    } catch {
      // console.warn("Code formatting failed:", error);
      console.warn("Code has issues, formatting failed.");
      // Return the original code if formatting fails
      return code;
    }
  }
}
