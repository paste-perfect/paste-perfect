/**
 * Interface defining the structure of a language definition.
 */
export interface LanguageDefinition {
  /** The human-readable name of the language.*/
  title: string;
  /** The unique identifier for the language. */
  value: string;
  /** List of dependencies required by the language. */
  dependencies: string[];
  /** Alternative names or aliases for filtering purposes. */
  filterAlias: string[];
  /** Define a custom import path (for custom languages */
  customImportPath?: string;
  /** Prettify parser (if supported) */
  prettier?: {
    parser: string;
    plugins: string[];
    external?: boolean;
  };
}
