// Helper type for clarity
import { getEntries } from "@utils/utils";

interface TestObj {
  a: number;
  b: string;
  c?: boolean;
}

describe("getEntries", () => {
  it("returns entries for a simple object", () => {
    const obj = { a: 1, b: "hello" };
    const result = getEntries(obj);
    expect(result).toEqual([
      ["a", 1],
      ["b", "hello"],
    ]);
  });

  it("includes optional keys if present", () => {
    const obj: TestObj = { a: 42, b: "test", c: true };
    const result = getEntries(obj);
    expect(result).toContainEqual(["c", true]);
  });

  it("does not include undefined optional properties that are not set", () => {
    const obj: TestObj = { a: 10, b: "value" };
    const result = getEntries(obj);
    const keys = result.map(([key]) => key);
    expect(keys).not.toContain("c");
  });

  it("returns an empty array for an empty object", () => {
    const result = getEntries({});
    expect(result).toEqual([]);
  });

  it("works with object values of different types", () => {
    const obj = { num: 1, str: "text", bool: false, arr: [1, 2], nested: { x: 1 } };
    const result = getEntries(obj);
    expect(result).toEqual([
      ["num", 1],
      ["str", "text"],
      ["bool", false],
      ["arr", [1, 2]],
      ["nested", { x: 1 }],
    ]);
  });

  it("ensures result is strongly typed as key-value pairs", () => {
    const obj = { x: 123, y: "abc" };
    const result = getEntries(obj);

    // Type check: ensure that TypeScript infers correct type
    result.forEach(([key, value]: [unknown, unknown]) => {
      if (key === "x") expect(typeof value).toBe("number");
      if (key === "y") expect(typeof value).toBe("string");
    });
  });
});
