import { PrettierLanguageConfiguration } from "./prettier-language-configuration.types";
import { PrismLanguageConfiguration } from "./prism-language-configuration.types";

/**
 * Interface defining the structure of a language definition.
 */
export interface LanguageDefinition {
  /** Human-readable display name of the language */
  readonly title: string;
  /** Unique identifier for the language (used as key) */
  readonly value: string;
  /** Alternative names for search/filtering functionality */
  readonly filterAlias: readonly string[];
  /** Configuration for PrismJS syntax highlighting */
  readonly prismConfiguration: PrismLanguageConfiguration;
  /** Optional configuration for Prettier code formatting (if supported) */
  readonly prettierConfiguration?: PrettierLanguageConfiguration;
}
