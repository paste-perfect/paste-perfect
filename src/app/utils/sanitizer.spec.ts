import { getEntries } from "@utils/utils";
import { SanitizerWrapper } from "@utils/sanitizer";
import { INPUT_SANITIZE_MAP, SpecialCharacters } from "@constants";

jest.mock("@utils/utils", () => ({
  // We need to return an empty array by default in order for languages.ts to properly work
  // As this gets executed immediately once the file is imported (to infer all supported languages)
  getEntries: jest.fn(() => []),
}));

describe("SanitizerWrapper", () => {
  describe("sanitizeInput", () => {
    beforeEach(() => {
      (getEntries as jest.Mock).mockReturnValue(Object.entries(INPUT_SANITIZE_MAP));
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("removes non-ASCII characters", () => {
      const input = "This is normal — but this dash is non-ASCII.";
      const result = SanitizerWrapper.sanitizeInput(input);
      expect(result).toBe("This is normal - but this dash is non-ASCII.");
    });

    it("removes leading and trailing blank lines", () => {
      const input = "\n\n\nHello world\n\n\n";
      const result = SanitizerWrapper.sanitizeInput(input);
      expect(result).toBe("Hello world");
    });

    it("removes both non-ASCII and blank lines", () => {
      const input = "\n\n—Hello world—\n\n";
      const result = SanitizerWrapper.sanitizeInput(input);
      expect(result).toBe("-Hello world-");
    });

    it("handles empty input gracefully", () => {
      const input = "";
      const result = SanitizerWrapper.sanitizeInput(input);
      expect(result).toBe("");
    });

    it("does not alter clean input", () => {
      const input = "Clean String";
      const result = SanitizerWrapper.sanitizeInput(input);
      expect(result).toBe("Clean String");
    });

    it("sanitizes all single quotation mark variants to apostrophe", () => {
      // Array of all single quotation mark variants that should become apostrophe
      const singleQuotationMarks = [
        SpecialCharacters.LEFT_SINGLE_QUOTE, // '
        SpecialCharacters.RIGHT_SINGLE_QUOTE, // '
        SpecialCharacters.SINGLE_LOW_9_QUOTE, // ‚
        SpecialCharacters.SINGLE_HIGH_REVERSED_9_QUOTE, // ‛
        SpecialCharacters.SINGLE_LEFT_ANGLE_QUOTE, // ‹
        SpecialCharacters.SINGLE_RIGHT_ANGLE_QUOTE, // ›
        SpecialCharacters.PRIME, // ′
        SpecialCharacters.REVERSED_PRIME, // ‵
      ];

      // Test each single quotation mark variant
      singleQuotationMarks.forEach((char) => {
        const input = `Hello ${char}world${char} test`;
        const result = SanitizerWrapper.sanitizeInput(input);
        expect(result).toBe("Hello 'world' test");

        // Also test the character in isolation
        const isolatedResult = SanitizerWrapper.sanitizeInput(char);
        expect(isolatedResult).toBe("'");
      });
    });

    it("sanitizes all double quotation mark variants to quotation mark", () => {
      // Array of all double quotation mark variants that should become quotation mark
      const doubleQuotationMarks = [
        SpecialCharacters.LEFT_DOUBLE_QUOTE, // "
        SpecialCharacters.RIGHT_DOUBLE_QUOTE, // "
        SpecialCharacters.DOUBLE_LOW_9_QUOTE, // „
        SpecialCharacters.DOUBLE_HIGH_REVERSED_9_QUOTE, // ‟
        SpecialCharacters.LEFT_ANGLE_QUOTE, // «
        SpecialCharacters.RIGHT_ANGLE_QUOTE, // »
        SpecialCharacters.DOUBLE_PRIME, // ″
        SpecialCharacters.TRIPLE_PRIME, // ‴
        SpecialCharacters.REVERSED_DOUBLE_PRIME, // ‶
        SpecialCharacters.REVERSED_TRIPLE_PRIME, // ‷
      ];

      // Test each double quotation mark variant
      doubleQuotationMarks.forEach((char) => {
        const input = `Hello ${char}world${char} test`;
        const result = SanitizerWrapper.sanitizeInput(input);
        expect(result).toBe('Hello "world" test');

        // Also test the character in isolation
        const isolatedResult = SanitizerWrapper.sanitizeInput(char);
        expect(isolatedResult).toBe('"');
      });
    });
  });

  describe("sanitizeOutput", () => {
    beforeEach(() => {
      (getEntries as jest.Mock).mockReturnValue([
        // Mock the output sanitize map as this is currently empty
        ["\n", "<br>"],
        ["\t", "&emsp;"],
      ]);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("replaces mapped characters in output correctly", () => {
      const input = "Line1\nLine2\tTabbed";
      const result = SanitizerWrapper.sanitizeOutput(input);
      expect(result).toBe("Line1<br>Line2&emsp;Tabbed");
    });

    it("returns original output if no mapped characters are present", () => {
      const input = "This has no mapped characters.";
      const result = SanitizerWrapper.sanitizeOutput(input);
      expect(result).toBe(input);
    });

    it("handles empty output gracefully", () => {
      const input = "";
      const result = SanitizerWrapper.sanitizeOutput(input);
      expect(result).toBe("");
    });

    it("handles output with only mappable characters", () => {
      const input = "\n\t\n";
      const result = SanitizerWrapper.sanitizeOutput(input);
      expect(result).toBe("<br>&emsp;<br>");
    });
  });

  describe("escapeUmlauts", () => {
    beforeEach(() => {
      (getEntries as jest.Mock).mockReturnValue([
        ["ä", "ae"],
        ["ö", "oe"],
        ["ü", "ue"],
        ["Ä", "AE"],
        ["Ö", "OE"],
        ["Ü", "UE"],
        ["ẞ", "SS"],
        ["ß", "ss"],
      ]);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("replaces German umlauts correctly", () => {
      const input = "Müller wohnt in Köln";
      const result = SanitizerWrapper.escapeUmlauts(input);
      expect(result).toBe("Mueller wohnt in Koeln");
    });

    it("replaces uppercase umlauts correctly", () => {
      const input = "MÜNCHEN und DÜSSELDORF";
      const result = SanitizerWrapper.escapeUmlauts(input);
      expect(result).toBe("MUENCHEN und DUESSELDORF");
    });

    it("replaces eszett correctly", () => {
      const input = "Straße und Weiß";
      const result = SanitizerWrapper.escapeUmlauts(input);
      expect(result).toBe("Strasse und Weiss");
    });

    it("handles mixed case umlauts", () => {
      const input = "Größe und schön";
      const result = SanitizerWrapper.escapeUmlauts(input);
      expect(result).toBe("Groesse und schoen");
    });

    it("returns original string if no umlauts present", () => {
      const input = "Hello World";
      const result = SanitizerWrapper.escapeUmlauts(input);
      expect(result).toBe("Hello World");
    });

    it("handles empty string gracefully", () => {
      const input = "";
      const result = SanitizerWrapper.escapeUmlauts(input);
      expect(result).toBe("");
    });

    it("preserves other non-ASCII characters", () => {
      const input = "Café with ümlauts and émojis 🎉";
      const result = SanitizerWrapper.escapeUmlauts(input);
      expect(result).toBe("Café with uemlauts and émojis 🎉");
    });
  });
});
