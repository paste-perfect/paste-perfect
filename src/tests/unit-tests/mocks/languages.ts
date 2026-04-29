import { LanguageDefinition } from "@types";
import { PRETTIER_LANGUAGE_MAP } from "./prettier-language-map-mock";

export const TYPESCRIPT: LanguageDefinition = {
  title: "TypeScript",
  value: "typescript",
  filterAlias: [],
  prismConfiguration: { dependencies: [], customImportPath: undefined, grammar: "ts" },
  prettierConfiguration: PRETTIER_LANGUAGE_MAP["typescript"],
};

export const JAVASCRIPT: LanguageDefinition = {
  title: "JavaScript",
  value: "javascript",
  filterAlias: [],
  prismConfiguration: { dependencies: [], customImportPath: undefined, grammar: "js" },
  prettierConfiguration: PRETTIER_LANGUAGE_MAP["javascript"],
};

export const JSX: LanguageDefinition = {
  title: "JSX",
  value: "jsx",
  filterAlias: [],
  prismConfiguration: { dependencies: ["react"], customImportPath: undefined, grammar: "jsx" },
  prettierConfiguration: PRETTIER_LANGUAGE_MAP["jsx"],
};

export const PYTHON: LanguageDefinition = {
  title: "Python",
  value: "python",
  filterAlias: [],
  prismConfiguration: { dependencies: [], customImportPath: undefined, grammar: "python" },
  prettierConfiguration: undefined,
};

export const MARKUP: LanguageDefinition = {
  title: "Markup",
  value: "markup",
  filterAlias: ["markdown"],
  prismConfiguration: { dependencies: ["html", "xml"], customImportPath: undefined, grammar: "markup" },
  prettierConfiguration: PRETTIER_LANGUAGE_MAP["markup"],
};

export const MARKUP_UI: LanguageDefinition = {
  title: "Markup UI",
  value: "markup-ui",
  filterAlias: [],
  prismConfiguration: { dependencies: [], customImportPath: undefined, grammar: "markup" },
  prettierConfiguration: undefined,
};

export const JSON_LANG: LanguageDefinition = {
  title: "JSON",
  value: "json",
  filterAlias: [],
  prismConfiguration: { dependencies: [], customImportPath: undefined, grammar: "json" },
  prettierConfiguration: PRETTIER_LANGUAGE_MAP["json"],
};

export const JSON_UNSORTED: LanguageDefinition = {
  title: "JSON Unsorted",
  value: "json-unsorted",
  filterAlias: [],
  prismConfiguration: { dependencies: [], customImportPath: undefined, grammar: "json" },
  prettierConfiguration: undefined,
};

export const CPP: LanguageDefinition = {
  title: "C++",
  value: "cpp",
  filterAlias: ["c++"], // Added alias since searching "c++" is common
  prismConfiguration: { dependencies: ["c"], customImportPath: undefined, grammar: "cpp" },
  prettierConfiguration: PRETTIER_LANGUAGE_MAP["cpp"],
};

export const CUSTOM_LANG: LanguageDefinition = {
  title: "Custom",
  value: "custom-lang",
  filterAlias: [],
  prismConfiguration: { dependencies: [], customImportPath: "assets/prism-custom.js", grammar: "custom" },
  prettierConfiguration: undefined,
};
