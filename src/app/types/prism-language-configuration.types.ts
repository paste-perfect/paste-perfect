/**
 * Interface defining prism-related language configuration
 */
export interface PrismLanguageConfiguration {
  /** List of language dependencies (by name) that must be loaded before this language */
  readonly dependencies: readonly string[];
  /** The unique Prism identifier used for registration and dependency resolution. */
  readonly grammar: string;
  /** Optional path to load the grammar from an external source instead of the standard library. */
  readonly customImportPath?: string;
}
