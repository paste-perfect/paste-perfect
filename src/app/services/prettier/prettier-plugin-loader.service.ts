import { inject, Injectable } from "@angular/core";
import { MessageService } from "primeng/api";
import { LanguageDefinition, PrettierParserNames, PrettierPluginType } from "@types";
import { Plugin as PrettierPlugin } from "prettier";

const unwrapPlugin = (m: unknown): PrettierPlugin => {
  // 1. Check if 'm' is an object that actually has a 'default' property
  if (m && typeof m === "object" && "default" in m) {
    return (m as { default: PrettierPlugin }).default;
  }

  // 2. Otherwise, assume the module itself is the plugin (CommonJS fallback)
  return m as PrettierPlugin;
};

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
  private readonly pluginCache = new Map<PrettierPluginType, PrettierPlugin>();

  /**
   * Mapping of plugin names to their import paths
   */
  private readonly pluginRegistry: Partial<Record<PrettierPluginType, () => Promise<PrettierPlugin>>> = {
    "prettier-plugin-java": () => import("prettier-plugin-java").then(unwrapPlugin),
    "prettier-plugin-gherkin": () => import("prettier-plugin-gherkin").then(unwrapPlugin),
    "prettier-plugin-nginx": () => import("prettier-plugin-nginx").then(unwrapPlugin),
    "prettier-plugin-sql": () => import("prettier-plugin-sql").then(unwrapPlugin),
    "prettier-plugin-toml": () => import("prettier-plugin-toml").then(unwrapPlugin),
    "prettier-plugin-sort-json": () => import("prettier-plugin-sort-json").then(unwrapPlugin),
  };

  /**
   * Gets the appropriate Prettier parser and required plugins for a given language
   *
   * @param language - The language to format
   * @returns A Promise resolving to an object containing the parser name and required plugins
   */
  public async getParserAndPlugins(language: LanguageDefinition): Promise<{
    parser: PrettierParserNames;
    plugins: PrettierPlugin[];
    pluginOptions?: Record<string, unknown>;
  } | null> {
    // Get Prettier config from language definition or use default
    const config = language?.prettierConfiguration;
    if (!config) {
      return null;
    }

    const requiredPlugins: PrettierPlugin[] = [];

    // Load all required plugins
    for (const plugin of config.plugins) {
      try {
        requiredPlugins.push(await this.loadPlugin(plugin));
      } catch (error) {
        console.warn(`Failed to load plugin ${plugin}, continuing with available plugins`, error);
      }
    }

    // Inject prettier-plugin-sort-json automatically for JSON parser
    if (config.parser === "json") {
      try {
        const sortJsonPlugin = await this.loadPlugin("prettier-plugin-sort-json");
        if (!requiredPlugins.includes(sortJsonPlugin)) {
          requiredPlugins.push(sortJsonPlugin);
        }
      } catch (error) {
        console.warn("Failed to load prettier-plugin-sort-json, JSON will be formatted without key sorting.", error);
      }
    }

    return {
      parser: config.parser,
      plugins: requiredPlugins,
      // Pass plugin-specific options for sort-json when applicable
      pluginOptions: config.parser === "json" ? { jsonRecursiveSort: true } : undefined,
    };
  }

  /**
   * Loads a Prettier plugin dynamically
   *
   * @param pluginName - The name of the plugin to load
   * @returns A Promise that resolves to the loaded plugin
   * @throws Error if plugin loading fails
   */
  private async loadPlugin(pluginName: PrettierPluginType): Promise<PrettierPlugin> {
    // Return from cache if already loaded
    const cachedPlugin = this.pluginCache.get(pluginName);
    if (cachedPlugin) {
      return cachedPlugin;
    }

    try {
      const isPluginInRegistry = pluginName in this.pluginRegistry;

      let plugin;
      if (isPluginInRegistry && this.pluginRegistry[pluginName]) {
        plugin = await this.pluginRegistry[pluginName]();
      } else {
        plugin = await import(/* @vite-ignore */ `../../../../node_modules/prettier/plugins/${pluginName}.mjs`);
      }

      // Store in cache
      this.pluginCache.set(pluginName, plugin);
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
      throw new Error(`Failed to load Prettier plugin: ${pluginName} - ${error instanceof Error ? error.message : String(error)}`, {
        cause: error,
      });
    }
  }
}
