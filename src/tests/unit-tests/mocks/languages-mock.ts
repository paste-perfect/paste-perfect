import type * as RealLanguages from "../../../app/constants/languages";
import { CUSTOM_LANG, JAVASCRIPT, JSON_LANG, JSON_UNSORTED, JSX, MARKUP, MARKUP_UI, PYTHON, CPP, TYPESCRIPT } from "./languages";
import { LanguageDefinition } from "@types";
import { AssertExact } from "../test-utils/types";

export const ALL_LANGUAGES: LanguageDefinition[] = [
  TYPESCRIPT,
  JAVASCRIPT,
  JSX,
  PYTHON,
  MARKUP,
  MARKUP_UI,
  JSON_LANG,
  JSON_UNSORTED,
  CPP,
  CUSTOM_LANG,
];

const POPULAR_SET = new Set(["javascript", "json", "markup", "python", "rust", "typescript"]);

export const POPULAR_LANGUAGES = ALL_LANGUAGES.filter((l) => POPULAR_SET.has(l.value));
export const OTHER_LANGUAGES = ALL_LANGUAGES.filter((l) => !POPULAR_SET.has(l.value));

const _exact: AssertExact<typeof import("./languages-mock"), typeof RealLanguages> = true;
