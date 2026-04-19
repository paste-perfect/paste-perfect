import { describe, expect, it } from "vitest";
import { searchLanguageByTitle, searchLanguageByValue } from "@utils/languages-utils";

const DEFAULT_JAVASCRIPT_LANGUAGE = {
  title: "JavaScript*",
  value: "javascript",
};

const DEFAULT_TYPESCRIPT_LANGUAGE = {
  title: "TypeScript*",
  value: "typescript",
};

// ---------------------------------------------------------------------------
describe("Language Utils", () => {
  // -------------------------------------------------------------------------
  describe("searchLanguageByTitle", () => {
    describe("exact and case-insensitive title matching", () => {
      it("should find a language by its exact title", () => {
        expect(searchLanguageByTitle("JavaScript")).toMatchObject(DEFAULT_JAVASCRIPT_LANGUAGE);
      });

      it("should find a language when the query casing differs from the stored title", () => {
        expect(searchLanguageByTitle("javascript")).toMatchObject(DEFAULT_JAVASCRIPT_LANGUAGE);
      });

      it("should find a language with special characters in its title (e.g. C++)", () => {
        expect(searchLanguageByTitle("C++")).toMatchObject({
          title: "C++",
          value: "cpp",
        });
      });
    });

    describe("alias matching", () => {
      const VISUAL_BASIC_LANGUAGE = {
        title: "Visual Basic",
        value: "visual-basic",
      };
      it("should find a language when queried by a known filter alias", () => {
        expect(searchLanguageByTitle("VBA")).toMatchObject(VISUAL_BASIC_LANGUAGE);
      });

      it("should find a language by alias regardless of input casing", () => {
        expect(searchLanguageByTitle(" vBa ")).toMatchObject(VISUAL_BASIC_LANGUAGE);
      });
    });

    describe("input normalisation", () => {
      it("should trim surrounding whitespace before matching", () => {
        expect(searchLanguageByTitle("  TypeScript  ")).toMatchObject(DEFAULT_TYPESCRIPT_LANGUAGE);
      });
    });

    describe("non-matching inputs", () => {
      it("should return undefined for a query that matches no title or alias", () => {
        expect(searchLanguageByTitle("NonExistentLanguage")).toBeUndefined();
      });

      it("should return undefined for an empty string", () => {
        expect(searchLanguageByTitle("")).toBeUndefined();
      });
    });
  });

  // -------------------------------------------------------------------------
  describe("searchLanguageByValue", () => {
    describe("exact and case-insensitive value matching", () => {
      it("should find a language by its exact value", () => {
        expect(searchLanguageByValue("javascript")).toMatchObject(DEFAULT_JAVASCRIPT_LANGUAGE);
      });

      it("should find a language when value query casing differs", () => {
        expect(searchLanguageByValue("JAVASCRIPT")).toMatchObject(DEFAULT_JAVASCRIPT_LANGUAGE);
      });
    });

    describe("input normalisation", () => {
      it("should trim surrounding whitespace before matching", () => {
        expect(searchLanguageByValue("  typescript  ")).toMatchObject(DEFAULT_TYPESCRIPT_LANGUAGE);
      });
    });

    describe("non-matching inputs", () => {
      it("should return undefined for a value that does not exist", () => {
        expect(searchLanguageByValue("nonexistent")).toBeUndefined();
      });

      it("should return undefined for an empty string", () => {
        expect(searchLanguageByValue("")).toBeUndefined();
      });

      it("should NOT match against filter aliases (value field only)", () => {
        // 'js' is a filterAlias for JavaScript, not a value — must not match
        expect(searchLanguageByValue("VBA")).toBeUndefined();
      });
    });
  });
});
