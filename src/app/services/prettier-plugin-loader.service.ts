// prettier-plugin-loader.service.ts

import { inject, Injectable } from "@angular/core";
import { MessageService } from "primeng/api";
import { LanguageDefinition } from "@types";
import { Plugin as PrettierPlugin } from "prettier";

/**
 * Service for dynamically loading Prettier plugins based on language requirements
 */
@Injectable({
  providedIn: "root",
})
export class PrettierPluginLoaderService {
  /**
   * PrimeNG's messages service for displaying toasts to the user
   */
  private readonly messageService = inject(MessageService);

  /**
   * Cache of loaded plugins to avoid reloading
   */
  private readonly loadedPlugins = new Map<string, PrettierPlugin>();

  /**
   * Loads a Prettier plugin dynamically
   *
   * @param pluginName - The name of the plugin to load (e.g., 'babel', 'typescript')
   * @returns A Promise that resolves to the loaded plugin
   * @throws Error if plugin loading fails
   */
  public async loadPlugin(pluginName: string): Promise<PrettierPlugin> {
    // Return from cache if already loaded
    if (this.loadedPlugins.has(pluginName)) {
      return this.loadedPlugins.get(pluginName)!;
    }

    try {
      // Use dynamic import for all plugins
      const plugin = await import(/* @vite-ignore */ `../../../node_modules/prettier/plugins/${pluginName}.mjs`);

      // Store in cache
      this.loadedPlugins.set(pluginName, plugin);
      return plugin;
    } catch (error) {
      // Log the error with more details
      console.error(`Failed to load Prettier plugin: ${pluginName}`, error);

      // Display user-friendly error message
      this.messageService.add({
        severity: "error",
        summary: "Prettier Plugin Error",
        detail: `Could not load prettier plugin for "${pluginName}". Please check if the plugin is installed correctly.`,
        life: 5000,
      });

      // Rethrow with more context
      throw new Error(`Failed to load Prettier plugin: ${pluginName} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets the appropriate Prettier parser and required plugins for a given language
   *
   * @param language - The language to format
   * @returns A Promise resolving to an object containing the parser name and required plugins
   */
  public async getParserAndPlugins(language: LanguageDefinition): Promise<{
    parser: string;
    plugins: PrettierPlugin[];
  } | null> {
    // Get Prettier config from language definition or use default
    const config = language?.prettier;
    if (!config) {
      return null;
    }

    const requiredPlugins = [];

    // Load all required plugins
    for (const plugin of config.plugins) {
      try {
        requiredPlugins.push(await this.loadPlugin(plugin));
      } catch (error) {
        console.warn(`Failed to load plugin ${plugin}, continuing with available plugins`, error);
      }
    }

    return {
      parser: config.parser,
      plugins: requiredPlugins,
    };
  }
}
