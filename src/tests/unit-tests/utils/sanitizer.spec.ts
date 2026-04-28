// sanitizer.spec.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { SanitizerWrapper } from "@utils/sanitizer";
import { SpecialCharacters } from "@constants";

// ---------------------------------------------------------------------------
// Quotation mark variant tables — kept at module scope so they can be reused
// as it.each sources without re-allocation per test run.
// ---------------------------------------------------------------------------
const SINGLE_QUOTE_VARIANTS: [label: string, char: SpecialCharacters][] = [
  ["LEFT_SINGLE_QUOTE", SpecialCharacters.LEFT_SINGLE_QUOTE],
  ["RIGHT_SINGLE_QUOTE", SpecialCharacters.RIGHT_SINGLE_QUOTE],
  ["SINGLE_LOW_9_QUOTE", SpecialCharacters.SINGLE_LOW_9_QUOTE],
  ["SINGLE_HIGH_REVERSED_9_QUOTE", SpecialCharacters.SINGLE_HIGH_REVERSED_9_QUOTE],
  ["SINGLE_LEFT_ANGLE_QUOTE", SpecialCharacters.SINGLE_LEFT_ANGLE_QUOTE],
  ["SINGLE_RIGHT_ANGLE_QUOTE", SpecialCharacters.SINGLE_RIGHT_ANGLE_QUOTE],
  ["PRIME", SpecialCharacters.PRIME],
  ["REVERSED_PRIME", SpecialCharacters.REVERSED_PRIME],
];

const DOUBLE_QUOTE_VARIANTS: [label: string, char: SpecialCharacters][] = [
  ["LEFT_DOUBLE_QUOTE", SpecialCharacters.LEFT_DOUBLE_QUOTE],
  ["RIGHT_DOUBLE_QUOTE", SpecialCharacters.RIGHT_DOUBLE_QUOTE],
  ["DOUBLE_LOW_9_QUOTE", SpecialCharacters.DOUBLE_LOW_9_QUOTE],
  ["DOUBLE_HIGH_REVERSED_9_QUOTE", SpecialCharacters.DOUBLE_HIGH_REVERSED_9_QUOTE],
  ["LEFT_ANGLE_QUOTE", SpecialCharacters.LEFT_ANGLE_QUOTE],
  ["RIGHT_ANGLE_QUOTE", SpecialCharacters.RIGHT_ANGLE_QUOTE],
  ["DOUBLE_PRIME", SpecialCharacters.DOUBLE_PRIME],
  ["TRIPLE_PRIME", SpecialCharacters.TRIPLE_PRIME],
  ["REVERSED_DOUBLE_PRIME", SpecialCharacters.REVERSED_DOUBLE_PRIME],
  ["REVERSED_TRIPLE_PRIME", SpecialCharacters.REVERSED_TRIPLE_PRIME],
];

describe("SanitizerWrapper", () => {
  // Defensive baseline — no spies in this suite, but keeps teardown uniform.
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sanitizeInput", () => {
    describe("non-ASCII handling", () => {
      it("should replace non-ASCII dash characters with ASCII equivalents", () => {
        const result = SanitizerWrapper.sanitizeInput("This is normal — but this dash is non-ASCII.");
        expect(result).toBe("This is normal - but this dash is non-ASCII.");
      });

      it("should return an empty string for empty input", () => {
        expect(SanitizerWrapper.sanitizeInput("")).toBe("");
      });

      it("should not alter clean ASCII input", () => {
        expect(SanitizerWrapper.sanitizeInput("Clean String")).toBe("Clean String");
      });
    });

    describe("whitespace trimming", () => {
      it("should remove leading and trailing blank lines", () => {
        expect(SanitizerWrapper.sanitizeInput("\n\n\nHello world\n\n\n")).toBe("Hello world");
      });

      it("should remove both non-ASCII characters and surrounding blank lines", () => {
        expect(SanitizerWrapper.sanitizeInput("\n\n—Hello world—\n\n")).toBe("-Hello world-");
      });
    });

    describe("single quotation mark normalisation", () => {
      it.each(SINGLE_QUOTE_VARIANTS)("should normalise %s to an apostrophe when used inline", (_label, char) => {
        expect(SanitizerWrapper.sanitizeInput(`Hello ${char}world${char} test`)).toBe("Hello 'world' test");
      });

      it.each(SINGLE_QUOTE_VARIANTS)("should normalise %s to an apostrophe when it is the entire input", (_label, char) => {
        expect(SanitizerWrapper.sanitizeInput(char)).toBe("'");
      });
    });

    describe("double quotation mark normalisation", () => {
      it.each(DOUBLE_QUOTE_VARIANTS)("should normalise %s to a standard quotation mark when used inline", (_label, char) => {
        expect(SanitizerWrapper.sanitizeInput(`Hello ${char}world${char} test`)).toBe('Hello "world" test');
      });

      it.each(DOUBLE_QUOTE_VARIANTS)("should normalise %s to a standard quotation mark when it is the entire input", (_label, char) => {
        expect(SanitizerWrapper.sanitizeInput(char)).toBe('"');
      });
    });
  });

  describe("sanitizeOutput", () => {
    it("should return the original string when no mapped characters are present", () => {
      const input = "Line1\nLine2\tTabbed";
      expect(SanitizerWrapper.sanitizeOutput(input)).toBe(input);
    });

    it("should return an empty string for empty input", () => {
      expect(SanitizerWrapper.sanitizeOutput("")).toBe("");
    });
  });

  describe("escapeUmlauts", () => {
    it("should replace lowercase German umlauts correctly", () => {
      expect(SanitizerWrapper.escapeUmlauts("Müller wohnt in Köln")).toBe("Mueller wohnt in Koeln");
    });

    it("should replace uppercase German umlauts correctly", () => {
      expect(SanitizerWrapper.escapeUmlauts("MÜNCHEN und DÜSSELDORF")).toBe("MUENCHEN und DUESSELDORF");
    });

    it("should replace the eszett character correctly", () => {
      expect(SanitizerWrapper.escapeUmlauts("Straße und Weiß")).toBe("Strasse und Weiss");
    });

    it("should handle mixed-case umlauts", () => {
      expect(SanitizerWrapper.escapeUmlauts("Größe und schön")).toBe("Groesse und schoen");
    });

    it("should return the original string when no umlauts are present", () => {
      expect(SanitizerWrapper.escapeUmlauts("Hello World")).toBe("Hello World");
    });

    it("should return an empty string for empty input", () => {
      expect(SanitizerWrapper.escapeUmlauts("")).toBe("");
    });

    it("should preserve non-umlaut non-ASCII characters", () => {
      expect(SanitizerWrapper.escapeUmlauts("Café with ümlauts and émojis 🎉")).toBe("Café with uemlauts and émojis 🎉");
    });
  });
});
