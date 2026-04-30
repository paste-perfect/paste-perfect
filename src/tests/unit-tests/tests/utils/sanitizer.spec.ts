import { describe, expect, it } from "vitest";
import { SanitizerWrapper } from "@utils/sanitizer";
import { SpecialCharacters } from "@constants/special-characters";
import { useStandardTeardown } from "../../test-utils/utils";

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
  useStandardTeardown();

  describe("sanitizeInput", () => {
    describe("non-ASCII handling", () => {
      it("replaces non-ASCII dash characters with ASCII equivalents", () => {
        expect(SanitizerWrapper.sanitizeInput("This is normal — but this dash is non-ASCII.")).toBe(
          "This is normal - but this dash is non-ASCII."
        );
      });

      it("returns an empty string for empty input", () => {
        expect(SanitizerWrapper.sanitizeInput("")).toBe("");
      });

      it("does not alter clean ASCII input", () => {
        expect(SanitizerWrapper.sanitizeInput("Clean String")).toBe("Clean String");
      });
    });

    describe("whitespace trimming", () => {
      it("removes leading and trailing blank lines", () => {
        expect(SanitizerWrapper.sanitizeInput("\n\n\nHello world\n\n\n")).toBe("Hello world");
      });

      it("removes both non-ASCII characters and surrounding blank lines", () => {
        expect(SanitizerWrapper.sanitizeInput("\n\n—Hello world—\n\n")).toBe("-Hello world-");
      });
    });

    describe("single quotation mark normalisation", () => {
      it.each(SINGLE_QUOTE_VARIANTS)("normalises %s to an apostrophe when used inline", (_label, char) => {
        expect(SanitizerWrapper.sanitizeInput(`Hello ${char}world${char} test`)).toBe("Hello 'world' test");
      });

      it.each(SINGLE_QUOTE_VARIANTS)("normalises %s to an apostrophe when it is the entire input", (_label, char) => {
        expect(SanitizerWrapper.sanitizeInput(char)).toBe("'");
      });
    });

    describe("double quotation mark normalisation", () => {
      it.each(DOUBLE_QUOTE_VARIANTS)("normalises %s to a standard quotation mark when used inline", (_label, char) => {
        expect(SanitizerWrapper.sanitizeInput(`Hello ${char}world${char} test`)).toBe('Hello "world" test');
      });

      it.each(DOUBLE_QUOTE_VARIANTS)("normalises %s to a standard quotation mark when it is the entire input", (_label, char) => {
        expect(SanitizerWrapper.sanitizeInput(char)).toBe('"');
      });
    });
  });

  describe("sanitizeOutput", () => {
    it("returns the original string when no mapped characters are present", () => {
      const input = "Line1\nLine2\tTabbed";
      expect(SanitizerWrapper.sanitizeOutput(input)).toBe(input);
    });

    it("returns an empty string for empty input", () => {
      expect(SanitizerWrapper.sanitizeOutput("")).toBe("");
    });
  });

  describe("escapeUmlauts", () => {
    it.each([
      ["lowercase German umlauts", "Müller wohnt in Köln", "Mueller wohnt in Koeln"],
      ["uppercase German umlauts", "MÜNCHEN und DÜSSELDORF", "MUENCHEN und DUESSELDORF"],
      ["the eszett character", "Straße und Weiß", "Strasse und Weiss"],
      ["mixed-case umlauts", "Größe und schön", "Groesse und schoen"],
      ["text with no umlauts (unchanged)", "Hello World", "Hello World"],
      ["empty input", "", ""],
      ["non-umlaut non-ASCII characters preserved", "Café with ümlauts and émojis 🎉", "Café with uemlauts and émojis 🎉"],
    ] as const)("handles %s", (_label, input, expected) => {
      expect(SanitizerWrapper.escapeUmlauts(input)).toBe(expected);
    });
  });
});
