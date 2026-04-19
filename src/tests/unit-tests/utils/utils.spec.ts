import { describe, it, expect } from "vitest";
import { getEntries } from "@utils/utils";

// ---------------------------------------------------------------------------
// Helper type for clarity
// ---------------------------------------------------------------------------
interface TestObj {
  a: number;
  b: string;
  c?: boolean;
}

describe("getEntries", () => {
  describe("basic behaviour", () => {
    it("should return entries for a simple object", () => {
      const obj = { a: 1, b: "hello" };
      const result = getEntries(obj);
      expect(result).toEqual([
        ["a", 1],
        ["b", "hello"],
      ]);
    });

    it("should return an empty array for an empty object", () => {
      const result = getEntries({});
      expect(result).toEqual([]);
    });

    it("should work with object values of different types", () => {
      const obj = {
        num: 1,
        str: "text",
        bool: false,
        arr: [1, 2],
        nested: { x: 1 },
      };
      const result = getEntries(obj);
      expect(result).toEqual([
        ["num", 1],
        ["str", "text"],
        ["bool", false],
        ["arr", [1, 2]],
        ["nested", { x: 1 }],
      ]);
    });
  });

  describe("optional properties", () => {
    it("should include optional keys when they are present", () => {
      const obj: TestObj = { a: 42, b: "test", c: true };
      expect(getEntries(obj)).toContainEqual(["c", true]);
    });

    it("should not include optional keys when they are absent", () => {
      const obj: TestObj = { a: 10, b: "value" };
      const keys = getEntries(obj).map(([key]) => key);
      expect(keys).not.toContain("c");
    });
  });

  describe("type safety", () => {
    it("should produce strongly-typed key-value pairs", () => {
      const obj = { x: 123, y: "abc" };
      const result = getEntries(obj);

      result.forEach(([key, value]: [unknown, unknown]) => {
        if (key === "x") expect(typeof value).toBe("number");
        if (key === "y") expect(typeof value).toBe("string");
      });
    });
  });
});
