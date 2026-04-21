import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InlineStyleApplier } from "@utils/inline-style-applier";
import { resetInlineStyleApplierState } from "../test-utils";

describe("InlineStyleApplier", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    // Isolate static state: no test should inherit styles captured by a sibling
    resetInlineStyleApplierState();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  describe("captureRootStyles", () => {
    it("should store non-default CSS properties found on the root element", () => {
      const root = document.createElement("div");
      root.style.color = "rgb(0, 0, 255)";
      root.style.fontStyle = "italic";
      container.appendChild(root);

      InlineStyleApplier.captureRootStyles(root);

      expect(InlineStyleApplier["rootStyleProperties"]).toMatchObject({
        color: "rgb(0, 0, 255)",
        "font-style": "italic",
      });
    });

    it("should NOT store CSS properties whose value matches the browser default", () => {
      const root = document.createElement("div");
      // font-weight: 400 is the UA default — must be excluded
      root.style.fontWeight = "400";
      container.appendChild(root);

      InlineStyleApplier.captureRootStyles(root);

      expect(InlineStyleApplier["rootStyleProperties"]).not.toHaveProperty("font-weight");
    });
  });

  describe("applyElementStyles", () => {
    it("should copy relevant computed styles from the original element to its clone", () => {
      const original = document.createElement("span");
      original.style.fontFamily = "Courier New";
      original.style.color = "rgb(0, 128, 0)";
      container.appendChild(original);

      const cloned = document.createElement("span");
      InlineStyleApplier.applyElementStyles(original, cloned);

      expect(cloned.style.getPropertyValue("font-family")).toBe('"Courier New"');
      expect(cloned.style.getPropertyValue("color")).toBe("rgb(0, 128, 0)");
    });

    it("should NOT apply a CSS property that has the browser's default value", () => {
      const original = document.createElement("span");
      // font-style: normal is the default — should be skipped
      original.style.fontStyle = "normal";
      container.appendChild(original);

      const cloned = document.createElement("span");
      InlineStyleApplier.applyElementStyles(original, cloned);

      expect(cloned.style.getPropertyValue("font-style")).toBe("");
    });
  });

  describe("applyStoredRootStyles", () => {
    it("should apply all previously captured non-default root styles to a new element", () => {
      InlineStyleApplier["rootStyleProperties"] = {
        color: "red",
        "font-style": "italic",
      };

      const target = document.createElement("span");
      InlineStyleApplier.applyStoredRootStyles(target);

      expect(target.style.getPropertyValue("color")).toBe("red");
      expect(target.style.getPropertyValue("font-style")).toBe("italic");
    });

    it("should NOT apply a stored property whose value is the browser default", () => {
      InlineStyleApplier["rootStyleProperties"] = { "font-weight": "400" };

      const target = document.createElement("span");
      InlineStyleApplier.applyStoredRootStyles(target);

      expect(target.style.getPropertyValue("font-weight")).toBe("");
    });

    it("should leave the element untouched when no root styles have been captured", () => {
      // resetInlineStyleApplierState() in beforeEach guarantees empty state
      const target = document.createElement("span");
      InlineStyleApplier.applyStoredRootStyles(target);

      expect(target.getAttribute("style")).toBeNull();
    });
  });
});
