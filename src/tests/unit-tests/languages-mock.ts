const makeLanguage = (value: string, filterAlias: string[] = [], customImportPath?: string, grammar?: string) => ({
  value,
  title: value,
  filterAlias,
  prismConfiguration: {
    grammar: grammar ?? value,
    dependencies: [],
    ...(customImportPath ? { customImportPath } : {}),
  },
  prettierConfiguration: undefined,
});

export const ALL_LANGUAGES = [
  makeLanguage("typescript", ["ts"], undefined, "typescript"),
  makeLanguage("javascript", ["js"], undefined, "javascript"),
  makeLanguage("jsx", ["react"], undefined, "jsx"),
  makeLanguage("python", ["py"], undefined, "python"),
  makeLanguage("markup", ["html", "xml"], undefined, "markup"),
  makeLanguage("json", [], undefined, "json"),
  makeLanguage("rust", ["rs"], undefined, "rust"),
  makeLanguage("custom-lang", [], "assets/prism-custom.js", "custom"),
];

const POPULAR_SET = new Set(["javascript", "json", "markup", "python", "rust", "typescript"]);

export const POPULAR_LANGUAGES = ALL_LANGUAGES.filter((l) => POPULAR_SET.has(l.value));
export const OTHER_LANGUAGES = ALL_LANGUAGES.filter((l) => !POPULAR_SET.has(l.value));
