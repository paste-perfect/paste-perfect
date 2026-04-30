import { describe, expect, it } from "vitest";
import { searchLanguageByTitle, searchLanguageByValue } from "@utils/languages-utils";
import { useStandardTeardown } from "../../test-utils/utils";
import { CPP, CUSTOM_LANG, JAVASCRIPT, TYPESCRIPT } from "../../mocks/languages";

describe("Language Utils", () => {
  useStandardTeardown();

  describe("searchLanguageByTitle", () => {
    describe("exact and case-insensitive title matching", () => {
      it("finds a language by its exact title", () => {
        expect(searchLanguageByTitle("JavaScript")).toMatchObject(JAVASCRIPT);
      });

      it("finds a language when query casing differs from the stored title", () => {
        expect(searchLanguageByTitle("javascript")).toMatchObject(JAVASCRIPT);
      });

      it("finds a language with special characters in its title (e.g. C++)", () => {
        expect(searchLanguageByTitle("C++")).toMatchObject(CPP);
      });
    });

    describe("alias matching", () => {
      it("finds a language when queried by a known filter alias", () => {
        expect(searchLanguageByTitle("custom")).toMatchObject(CUSTOM_LANG);
      });

      it("finds a language by alias regardless of input casing or whitespace", () => {
        expect(searchLanguageByTitle(" cUStOm ")).toMatchObject(CUSTOM_LANG);
      });
    });

    describe("input normalisation", () => {
      it("trims surrounding whitespace before matching", () => {
        expect(searchLanguageByTitle("  TypeScript  ")).toMatchObject(TYPESCRIPT);
      });
    });

    describe("non-matching inputs", () => {
      it.each([
        ["unknown language", "NonExistentLanguage"],
        ["empty string", ""],
      ])("returns undefined for %s", (_label, input) => {
        expect(searchLanguageByTitle(input)).toBeUndefined();
      });
    });
  });

  describe("searchLanguageByValue", () => {
    describe("exact and case-insensitive value matching", () => {
      it("finds a language by its exact value", () => {
        expect(searchLanguageByValue("javascript")).toMatchObject(JAVASCRIPT);
      });

      it("finds a language when value query casing differs", () => {
        expect(searchLanguageByValue("JAVASCRIPT")).toMatchObject(JAVASCRIPT);
      });
    });

    describe("input normalisation", () => {
      it("trims surrounding whitespace before matching", () => {
        expect(searchLanguageByValue("  typescript  ")).toMatchObject(TYPESCRIPT);
      });
    });

    describe("non-matching inputs", () => {
      it.each([
        ["unknown value", "nonexistent"],
        ["empty string", ""],
      ])("returns undefined for %s", (_label, input) => {
        expect(searchLanguageByValue(input)).toBeUndefined();
      });

      it("does NOT match against filter aliases (value field only)", () => {
        // 'markdown' is a filterAlias for MARKUP, not a value — must not match here.
        expect(searchLanguageByValue("markdown")).toBeUndefined();
      });
    });
  });
});
