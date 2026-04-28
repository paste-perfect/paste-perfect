import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeToArray } from "@utils/normalization";

describe("Normalization", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("normalizeToArray", () => {
    describe("when the input is already an array", () => {
      it("should return the same array reference unchanged", () => {
        const input = ["item1", "item2", "item3"];
        const result = normalizeToArray(input);
        expect(result).toBe(input);
        expect(result).toEqual(["item1", "item2", "item3"]);
      });

      it("should return an empty array unchanged", () => {
        expect(normalizeToArray([])).toEqual([]);
      });
    });

    describe("when the input is a string", () => {
      it("should wrap a non-empty string in an array", () => {
        expect(normalizeToArray("single-item")).toEqual(["single-item"]);
      });

      it("should wrap an empty string in an array (preserving the value)", () => {
        expect(normalizeToArray("")).toEqual([""]);
      });
    });

    describe("when the input is null, undefined, or an unsupported type", () => {
      it("should return an empty array for null", () => {
        expect(normalizeToArray(null)).toEqual([]);
      });

      it("should return an empty array for undefined", () => {
        expect(normalizeToArray(undefined)).toEqual([]);
      });

      it("should return an empty array for a number", () => {
        expect(normalizeToArray(123 as never)).toEqual([]);
      });

      it("should return an empty array for a boolean", () => {
        expect(normalizeToArray(true as never)).toEqual([]);
      });

      it("should return an empty array for a plain object", () => {
        expect(normalizeToArray({} as never)).toEqual([]);
      });
    });
  });
});
