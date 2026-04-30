import { describe, expect, it } from "vitest";
import { normalizeToArray } from "@utils/normalization";
import { useStandardTeardown } from "../../test-utils/utils";

describe("normalizeToArray", () => {
  useStandardTeardown();

  describe("when the input is already an array", () => {
    it("returns the same array reference unchanged", () => {
      const input = ["item1", "item2", "item3"];
      expect(normalizeToArray(input)).toBe(input);
    });

    it("returns an empty array unchanged", () => {
      expect(normalizeToArray([])).toEqual([]);
    });
  });

  describe("when the input is a string", () => {
    it.each([
      ["non-empty string", "single-item", ["single-item"]],
      ["empty string", "", [""]],
    ] as const)("wraps a %s in an array", (_label, input, expected) => {
      expect(normalizeToArray(input)).toEqual(expected);
    });
  });

  describe("when the input is null, undefined, or an unsupported type", () => {
    it.each([
      ["null", null],
      ["undefined", undefined],
      ["number", 123],
      ["boolean", true],
      ["plain object", {}],
    ])("returns an empty array for %s", (_label, input) => {
      expect(normalizeToArray(input as never)).toEqual([]);
    });
  });
});
