/**
 * Interface defining prism-related language configuration
 */
export interface PrismLanguageConfiguration {
  /** List of language dependencies that must be loaded before this language */
  readonly dependencies: readonly string[];
  /** Custom import path for languages not in the standard PrismJS distribution */
  readonly customImportPath?: string;
}
