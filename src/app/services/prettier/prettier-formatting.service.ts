import { inject, Injectable } from "@angular/core";
import { LanguageDefinition } from "@types";
import * as prettier from "prettier/standalone";
import { PrettierPluginLoaderService } from "@services/prettier/prettier-plugin-loader.service";
import { SettingsService } from "@services/settings.service";
import { IndentationMode } from "@constants";

/**
 * Service responsible for code formatting using Prettier
 */
@Injectable({
  providedIn: "root",
})
export class PrettierFormattingService {
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
  public async formatCode(
    code: string,
    language: LanguageDefinition
  ): Promise<{
    code: string;
    formattingSuccessful: boolean;
  }> {
    const settings = this.settingsService.editorSettings;
    console.log("TEST1234");
    console.log("!settings.enableFormatting", !settings.enableFormatting);
    console.log("!code?.trim()", !code?.trim());

    // Return original code if formatting is disabled or code is empty
    if (!settings.enableFormatting || !code?.trim()) {
      return { code, formattingSuccessful: true };
    }

    try {
      // Get the appropriate parser and plugins for the language
      const result = await this.pluginLoader.getParserAndPlugins(language);
      console.log(result);

      // Output the original code if no prettier was found
      if (!result) {
        return { code, formattingSuccessful: true };
      }

      const { parser, plugins } = result;

      // Format the code with the appropriate parser and plugins
      return {
        code: await prettier.format(code, {
          parser,
          plugins,
          printWidth: 140,
          tabWidth: settings.indentationSize,
          useTabs: settings.indentationMode === IndentationMode.Tabs,
          semi: true,
          singleQuote: false,
          trailingComma: "es5",
          bracketSpacing: true,
          arrowParens: "always",
          endOfLine: "lf",
        }),
        formattingSuccessful: true,
      };
    } catch (error) {
      console.log(error);
      console.warn("Code has issues, formatting failed.");
      // Return the original code if formatting fails
      return { code, formattingSuccessful: false };
    }
  }
}
