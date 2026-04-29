import type * as RealLanguages from "../../../app/constants/languages";
import { LanguageDefinition } from "@types";
import { PRETTIER_LANGUAGE_MAP } from "./prettier-language-map-mock";
import { AssertExact } from "../test-utils/types";

export const ALL_LANGUAGES: LanguageDefinition[] = [
  {
    title: "typescript",
    value: "typescript",
    filterAlias: [],
    prismConfiguration: { dependencies: ["ts"], customImportPath: undefined, grammar: "typescript" },
    prettierConfiguration: PRETTIER_LANGUAGE_MAP["typescript"],
  },
  {
    title: "javascript",
    value: "javascript",
    filterAlias: [],
    prismConfiguration: { dependencies: ["js"], customImportPath: undefined, grammar: "javascript" },
    prettierConfiguration: PRETTIER_LANGUAGE_MAP["javascript"],
  },
  {
    title: "jsx",
    value: "jsx",
    filterAlias: [],
    prismConfiguration: { dependencies: ["react"], customImportPath: undefined, grammar: "jsx" },
    prettierConfiguration: PRETTIER_LANGUAGE_MAP["jsx"],
  },
  {
    title: "python",
    value: "python",
    filterAlias: [],
    prismConfiguration: { dependencies: ["py"], customImportPath: undefined, grammar: "python" },
    prettierConfiguration: undefined,
  },
  {
    title: "markup",
    value: "markup",
    filterAlias: [],
    prismConfiguration: { dependencies: ["html", "xml"], customImportPath: undefined, grammar: "markup" },
    prettierConfiguration: PRETTIER_LANGUAGE_MAP["markup"],
  },
  {
    title: "json",
    value: "json",
    filterAlias: [],
    prismConfiguration: { dependencies: [], customImportPath: undefined, grammar: "json" },
    prettierConfiguration: PRETTIER_LANGUAGE_MAP["json"],
  },
  {
    title: "rust",
    value: "rust",
    filterAlias: [],
    prismConfiguration: { dependencies: ["rs"], customImportPath: undefined, grammar: "rust" },
    prettierConfiguration: PRETTIER_LANGUAGE_MAP["rust"],
  },
  {
    title: "custom-lang",
    value: "custom-lang",
    filterAlias: [],
    prismConfiguration: { dependencies: [], customImportPath: "assets/prism-custom.js", grammar: "custom" },
    prettierConfiguration: undefined,
  },
];

const POPULAR_SET = new Set(["javascript", "json", "markup", "python", "rust", "typescript"]);

export const POPULAR_LANGUAGES = ALL_LANGUAGES.filter((l) => POPULAR_SET.has(l.value));
export const OTHER_LANGUAGES = ALL_LANGUAGES.filter((l) => !POPULAR_SET.has(l.value));

const _exact: AssertExact<typeof import("./languages-mock"), typeof RealLanguages> = true;
