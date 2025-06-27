import { PrettierParserNames } from "./prettier-parsers.types";
import { PrettierPluginType } from "./prettier-plugin.type";

/**
 * Interface defining prettier-related language configuration
 */
export interface PrettierLanguageConfiguration {
  /** The parser to use for formatting this language */
  readonly parser: PrettierParserNames;
  /** List of Prettier plugins required for this language */
  readonly plugins: readonly PrettierPluginType[];
}
