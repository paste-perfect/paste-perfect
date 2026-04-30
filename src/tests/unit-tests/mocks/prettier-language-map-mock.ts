import type * as RealPrettierLanguageMap from "../../../app/constants/prettier-language-map";
import { PrettierLanguageConfiguration } from "@types";
import { AssertExact } from "../test-utils/types";

export const PRETTIER_LANGUAGE_MAP: Record<string, PrettierLanguageConfiguration> = {
  javascript: { parser: "babel", plugins: ["babel", "estree"] },
  jsx: { parser: "babel", plugins: ["babel", "estree"] },
  json: { parser: "json", plugins: ["babel", "estree"] },
  markup: { parser: "html", plugins: ["html"] },
  typescript: { parser: "typescript", plugins: ["typescript", "estree"] },
} as const;

const _exact: AssertExact<typeof import("./prettier-language-map-mock"), typeof RealPrettierLanguageMap> = true;
