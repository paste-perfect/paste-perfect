import { getEntries } from "@utils/utils";
import { SanitizerWrapper } from "@utils/sanitizer";

jest.mock("@utils/utils", () => ({
  // We need to return an empty array by default in order for languages.ts to properly work
  // As this gets executed immediately once the file is imported (to infer all supported languages)
  getEntries: jest.fn(() => []),
}));

describe("SanitizerWrapper", () => {
  describe("sanitizeInput", () => {
    beforeEach(() => {
      (getEntries as jest.Mock).mockReturnValue([
        ["&", "and"],
        ["\\$", "USD"],
      ]);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("replaces mapped characters correctly", () => {
      const input = "Tom & Jerry cost $5";
      const result = SanitizerWrapper.sanitizeInput(input);
      expect(result).toBe("Tom and Jerry cost USD5");
    });

    it("removes non-ASCII characters", () => {
      const input = "This is normal — but this dash is non-ASCII.";
      const result = SanitizerWrapper.sanitizeInput(input);
      expect(result).toBe("This is normal  but this dash is non-ASCII.");
    });

    it("removes leading and trailing blank lines", () => {
      const input = "\n\n\nHello world\n\n\n";
      const result = SanitizerWrapper.sanitizeInput(input);
      expect(result).toBe("Hello world");
    });

    it("removes both non-ASCII and blank lines", () => {
      const input = "\n\n—Hello world—\n\n";
      const result = SanitizerWrapper.sanitizeInput(input);
      expect(result).toBe("Hello world");
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
  });

  describe("sanitizeOutput", () => {
    beforeEach(() => {
      (getEntries as jest.Mock).mockReturnValue([
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
});
