import { describe, expect, it } from "vitest";
import { getEntries } from "@utils/utils";
import { useStandardTeardown } from "../../test-utils/utils";

interface TestObj {
  a: number;
  b: string;
  c?: boolean;
}

describe("getEntries", () => {
  useStandardTeardown();

  describe("basic behaviour", () => {
    it("returns entries for a simple object", () => {
      expect(getEntries({ a: 1, b: "hello" })).toEqual([
        ["a", 1],
        ["b", "hello"],
      ]);
    });

    it("returns an empty array for an empty object", () => {
      expect(getEntries({})).toEqual([]);
    });

    it("works with object values of different types", () => {
      expect(getEntries({ num: 1, str: "text", bool: false, arr: [1, 2], nested: { x: 1 } })).toEqual([
        ["num", 1],
        ["str", "text"],
        ["bool", false],
        ["arr", [1, 2]],
        ["nested", { x: 1 }],
      ]);
    });
  });

  describe("optional properties", () => {
    it("includes optional keys when they are present", () => {
      const obj: TestObj = { a: 42, b: "test", c: true };
      expect(getEntries(obj)).toContainEqual(["c", true]);
    });

    it("does not include optional keys when they are absent", () => {
      const obj: TestObj = { a: 10, b: "value" };
      expect(getEntries(obj).map(([key]) => key)).not.toContain("c");
    });
  });

  describe("type safety", () => {
    it("produces strongly-typed key-value pairs", () => {
      const result = getEntries({ x: 123, y: "abc" });
      result.forEach(([key, value]) => {
        if (key === "x") expect(typeof value).toBe("number");
        if (key === "y") expect(typeof value).toBe("string");
      });
    });
  });
});
