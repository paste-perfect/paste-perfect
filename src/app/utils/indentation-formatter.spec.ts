import { IndentationFormatter } from "./indentation-formatter";
import { SpecialCharacters } from "../constants";

describe("IndentationFormatter", () => {
  const tabSize = 2;

  describe("maskIndentation", () => {
    it("should replace leading spaces with markers", () => {
      const result = IndentationFormatter.maskIndentation("  const x = 1;", tabSize);
      expect(result).toBe(`${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}const x = 1;`);
    });

    it("should replace leading tabs with repeated markers", () => {
      const result = IndentationFormatter.maskIndentation("\tconst x = 1;", tabSize);
      expect(result).toBe(`${SpecialCharacters.MARKER.repeat(tabSize)}const x = 1;`);
    });

    it("should handle mixed tabs and spaces", () => {
      const result = IndentationFormatter.maskIndentation("\t  const x = 1;", tabSize);
      expect(result).toBe(`${SpecialCharacters.MARKER.repeat(tabSize)}${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}const x = 1;`);
    });
  });

  describe("unmaskIndentationWithTabs", () => {
    it("should convert marker groups to tabs and remaining to spaces", () => {
      const input = `${SpecialCharacters.MARKER.repeat(tabSize)}${SpecialCharacters.MARKER}const x = 1;`;
      const result = IndentationFormatter.unmaskIndentationWithTabs(input, tabSize);
      expect(result).toBe(`\t const x = 1;`);
    });
  });

  describe("unmaskIndentationWithNbsp", () => {
    it("should convert all markers to non-breaking spaces", () => {
      const input = `${SpecialCharacters.MARKER}${SpecialCharacters.MARKER}const x = 1;`;
      const result = IndentationFormatter.unmaskIndentationWithNbsp(input);
      expect(result).toBe(`${SpecialCharacters.NON_BREAKING_SPACE}${SpecialCharacters.NON_BREAKING_SPACE}const x = 1;`);
    });
  });
});
