import { normalizeToArray, searchLanguageByTitle, searchLanguageByValue } from "@utils/languages-utils";

jest.mock("@constants", () => ({
  ALL_LANGUAGES: [
    {
      title: "JavaScript",
      value: "javascript",
      filterAlias: ["js", "node"],
    },
    {
      title: "TypeScript",
      value: "typescript",
      filterAlias: ["ts"],
    },
    {
      title: "Python",
      value: "python",
      filterAlias: ["py"],
    },
    {
      title: "C++",
      value: "cpp",
      filterAlias: ["c++", "cplusplus"],
    },
  ],
}));

describe("Language Utils", () => {
  describe("searchLanguageByTitle", () => {
    it("should find language by exact title match (case-insensitive)", () => {
      const result = searchLanguageByTitle("JavaScript");
      expect(result).toEqual({
        title: "JavaScript",
        value: "javascript",
        filterAlias: ["js", "node"],
      });
    });

    it("should find language by title with different case", () => {
      const result = searchLanguageByTitle("javascript");
      expect(result).toEqual({
        title: "JavaScript",
        value: "javascript",
        filterAlias: ["js", "node"],
      });
    });

    it("should find language by filter alias", () => {
      const result = searchLanguageByTitle("js");
      expect(result).toEqual({
        title: "JavaScript",
        value: "javascript",
        filterAlias: ["js", "node"],
      });
    });

    it("should find language by filter alias with different case", () => {
      const result = searchLanguageByTitle("JS");
      expect(result).toEqual({
        title: "JavaScript",
        value: "javascript",
        filterAlias: ["js", "node"],
      });
    });

    it("should handle whitespace in input", () => {
      const result = searchLanguageByTitle("  TypeScript  ");
      expect(result).toEqual({
        title: "TypeScript",
        value: "typescript",
        filterAlias: ["ts"],
      });
    });

    it("should return undefined for non-existent language", () => {
      const result = searchLanguageByTitle("NonExistentLanguage");
      expect(result).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      const result = searchLanguageByTitle("");
      expect(result).toBeUndefined();
    });

    it("should find language with special characters in title", () => {
      const result = searchLanguageByTitle("C++");
      expect(result).toEqual({
        title: "C++",
        value: "cpp",
        filterAlias: ["c++", "cplusplus"],
      });
    });
  });

  describe("searchLanguageByValue", () => {
    it("should find language by exact value match", () => {
      const result = searchLanguageByValue("javascript");
      expect(result).toEqual({
        title: "JavaScript",
        value: "javascript",
        filterAlias: ["js", "node"],
      });
    });

    it("should find language by value with different case", () => {
      const result = searchLanguageByValue("JAVASCRIPT");
      expect(result).toEqual({
        title: "JavaScript",
        value: "javascript",
        filterAlias: ["js", "node"],
      });
    });

    it("should handle whitespace in input", () => {
      const result = searchLanguageByValue("  typescript  ");
      expect(result).toEqual({
        title: "TypeScript",
        value: "typescript",
        filterAlias: ["ts"],
      });
    });

    it("should return undefined for non-existent value", () => {
      const result = searchLanguageByValue("nonexistent");
      expect(result).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      const result = searchLanguageByValue("");
      expect(result).toBeUndefined();
    });

    it("should not match filter aliases", () => {
      const result = searchLanguageByValue("js");
      expect(result).toBeUndefined();
    });
  });

  describe("normalizeToArray", () => {
    it("should return array as is when input is already an array", () => {
      const input = ["item1", "item2", "item3"];
      const result = normalizeToArray(input);
      expect(result).toEqual(["item1", "item2", "item3"]);
      expect(result).toBe(input); // Should be the same reference
    });

    it("should wrap string in array", () => {
      const result = normalizeToArray("single-item");
      expect(result).toEqual(["single-item"]);
    });

    it("should wrap empty string in array", () => {
      const result = normalizeToArray("");
      expect(result).toEqual([""]);
    });

    it("should return empty array for null", () => {
      const result = normalizeToArray(null);
      expect(result).toEqual([]);
    });

    it("should return empty array for undefined", () => {
      const result = normalizeToArray(undefined);
      expect(result).toEqual([]);
    });

    it("should return empty array for number", () => {
      const result = normalizeToArray(123 as never);
      expect(result).toEqual([]);
    });

    it("should return empty array for boolean", () => {
      const result = normalizeToArray(true as never);
      expect(result).toEqual([]);
    });

    it("should return empty array for object", () => {
      const result = normalizeToArray({} as never);
      expect(result).toEqual([]);
    });

    it("should handle empty array", () => {
      const result = normalizeToArray([]);
      expect(result).toEqual([]);
    });
  });
});
