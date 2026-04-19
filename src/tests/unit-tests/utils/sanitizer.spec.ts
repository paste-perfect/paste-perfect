import { describe, expect, it } from "vitest";
import { SanitizerWrapper } from "@utils/sanitizer";
import { SpecialCharacters } from "@constants";

describe("SanitizerWrapper", () => {
  // ─── sanitizeInput ────────────────────────────────────────────────────────
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
      const singleQuotationMarks = [
        SpecialCharacters.LEFT_SINGLE_QUOTE,
        SpecialCharacters.RIGHT_SINGLE_QUOTE,
        SpecialCharacters.SINGLE_LOW_9_QUOTE,
        SpecialCharacters.SINGLE_HIGH_REVERSED_9_QUOTE,
        SpecialCharacters.SINGLE_LEFT_ANGLE_QUOTE,
        SpecialCharacters.SINGLE_RIGHT_ANGLE_QUOTE,
        SpecialCharacters.PRIME,
        SpecialCharacters.REVERSED_PRIME,
      ];

      it("should normalise all single quotation mark variants to an apostrophe", () => {
        singleQuotationMarks.forEach((char) => {
          expect(SanitizerWrapper.sanitizeInput(`Hello ${char}world${char} test`)).toBe("Hello 'world' test");

          expect(SanitizerWrapper.sanitizeInput(char)).toBe("'");
        });
      });
    });

    describe("double quotation mark normalisation", () => {
      const doubleQuotationMarks = [
        SpecialCharacters.LEFT_DOUBLE_QUOTE,
        SpecialCharacters.RIGHT_DOUBLE_QUOTE,
        SpecialCharacters.DOUBLE_LOW_9_QUOTE,
        SpecialCharacters.DOUBLE_HIGH_REVERSED_9_QUOTE,
        SpecialCharacters.LEFT_ANGLE_QUOTE,
        SpecialCharacters.RIGHT_ANGLE_QUOTE,
        SpecialCharacters.DOUBLE_PRIME,
        SpecialCharacters.TRIPLE_PRIME,
        SpecialCharacters.REVERSED_DOUBLE_PRIME,
        SpecialCharacters.REVERSED_TRIPLE_PRIME,
      ];

      it("should normalise all double quotation mark variants to a standard quotation mark", () => {
        doubleQuotationMarks.forEach((char) => {
          expect(SanitizerWrapper.sanitizeInput(`Hello ${char}world${char} test`)).toBe('Hello "world" test');

          expect(SanitizerWrapper.sanitizeInput(char)).toBe('"');
        });
      });
    });
  });

  // ─── sanitizeOutput ───────────────────────────────────────────────────────
  describe("sanitizeOutput", () => {
    it("should return the original string when no mapped characters are present (or map is empty)", () => {
      const input = "Line1\nLine2\tTabbed";
      // Since OUTPUT_SANITIZE_MAP is currently empty in constants.ts, it should return the exact input
      expect(SanitizerWrapper.sanitizeOutput(input)).toBe(input);
    });

    it("should return an empty string for empty input", () => {
      expect(SanitizerWrapper.sanitizeOutput("")).toBe("");
    });

    // NOTE: Uncomment this test once you uncomment the NEWLINE replacement in OUTPUT_SANITIZE_MAP
    /*
    it('should replace mapped characters in output correctly based on real constants', () => {
      expect(SanitizerWrapper.sanitizeOutput('Line1\nLine2')).toBe(
        'Line1<br>Line2',
      );
    });
    */
  });

  // ─── escapeUmlauts ────────────────────────────────────────────────────────
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
      // é is preserved, ü is replaced
      expect(SanitizerWrapper.escapeUmlauts("Café with ümlauts and émojis 🎉")).toBe("Café with uemlauts and émojis 🎉");
    });
  });
});
