import { beforeEach, describe, expect, it, vi } from "vitest";
import { NodeUtils } from "@utils/node-utils";
import { SpecialCharacters } from "@constants/special-characters";
import { MsOfficeUtils } from "@utils/ms-office-utils";
import { useStandardTeardown } from "../../test-utils/utils";

describe("MsOfficeUtils", () => {
  let mockElement: HTMLElement;
  let createSpanWithTextContentSpy: ReturnType<typeof vi.spyOn>;
  let appendInlineStyleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockElement = document.createElement("div");
    createSpanWithTextContentSpy = vi.spyOn(NodeUtils, "createSpanWithTextContent");
    appendInlineStyleSpy = vi.spyOn(NodeUtils, "appendInlineStyle");
  });

  useStandardTeardown();

  describe("createEmptyLineSpan", () => {
    it("creates a span containing a non-breaking space and applies the mso-spacerun style", () => {
      const mockSpan = document.createElement("span");
      createSpanWithTextContentSpy.mockReturnValue(mockSpan);

      const result = MsOfficeUtils.createEmptyLineSpan();

      expect(createSpanWithTextContentSpy).toHaveBeenCalledWith(SpecialCharacters.NON_BREAKING_SPACE);
      expect(appendInlineStyleSpy).toHaveBeenCalledWith(mockSpan, "mso-spacerun:yes");
      expect(result).toBe(mockSpan);
    });
  });

  describe("applyNoMarginStyle", () => {
    it('applies the "margin:0cm;" inline style to the element', () => {
      MsOfficeUtils.applyNoMarginStyle(mockElement);
      expect(appendInlineStyleSpy).toHaveBeenCalledWith(mockElement, "margin:0cm;");
    });
  });

  describe("preserveWhiteSpace", () => {
    it('applies the "mso-spacerun:yes" style to preserve whitespace', () => {
      MsOfficeUtils.preserveWhiteSpace(mockElement);
      expect(appendInlineStyleSpy).toHaveBeenCalledWith(mockElement, "mso-spacerun:yes");
    });
  });

  describe("applyTabSpacing", () => {
    it.each([
      ["a positive count", 3, "mso-tab-count:3"],
      ["a tab count of zero", 0, "mso-tab-count:0"],
    ] as const)("applies the correct mso-tab-count for %s", (_label, count, expected) => {
      MsOfficeUtils.applyTabSpacing(mockElement, count);
      expect(appendInlineStyleSpy).toHaveBeenCalledWith(mockElement, expected);
    });
  });

  describe("getTabStops", () => {
    it("returns an empty string when count is 0", () => {
      expect(MsOfficeUtils.getTabStops(0)).toBe("");
    });

    it.each([
      ["multiple stops without an offset", 2, undefined, "tab-stops: left 28.3465pt left 56.6930pt;"],
      ["a positive offset applied to each stop", 2, 10, "tab-stops: left 38.3465pt left 66.6930pt;"],
      ["a negative offset applied to each stop", 2, -5, "tab-stops: left 23.3465pt left 51.6930pt;"],
    ] as const)("returns CSS tab-stops for %s", (_label, count, offset, expected) => {
      expect(offset === undefined ? MsOfficeUtils.getTabStops(count) : MsOfficeUtils.getTabStops(count, offset)).toBe(expected);
    });
  });
});
