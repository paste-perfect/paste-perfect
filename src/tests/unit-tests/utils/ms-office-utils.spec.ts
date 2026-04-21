import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NodeUtils } from "@utils/node-utils";
import { SpecialCharacters } from "@constants";
import { MsOfficeUtils } from "@utils/ms-office-utils";

describe("MsOfficeUtils", () => {
  let mockElement: HTMLElement;
  // Spy references are re-created per test to guarantee clean state.
  let createSpanWithTextContentSpy: ReturnType<typeof vi.spyOn>;
  let appendInlineStyleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockElement = document.createElement("div");
    createSpanWithTextContentSpy = vi.spyOn(NodeUtils, "createSpanWithTextContent");
    appendInlineStyleSpy = vi.spyOn(NodeUtils, "appendInlineStyle");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createEmptyLineSpan", () => {
    it("should create a span containing a non-breaking space and apply the mso-spacerun style", () => {
      const mockSpan = document.createElement("span");
      createSpanWithTextContentSpy.mockReturnValue(mockSpan);

      const result = MsOfficeUtils.createEmptyLineSpan();

      expect(createSpanWithTextContentSpy).toHaveBeenCalledWith(SpecialCharacters.NON_BREAKING_SPACE);
      expect(appendInlineStyleSpy).toHaveBeenCalledWith(mockSpan, "mso-spacerun:yes");
      expect(result).toBe(mockSpan);
    });
  });

  describe("applyNoMarginStyle", () => {
    it('should apply the "margin:0cm;" inline style to the element', () => {
      MsOfficeUtils.applyNoMarginStyle(mockElement);
      expect(appendInlineStyleSpy).toHaveBeenCalledWith(mockElement, "margin:0cm;");
    });
  });

  describe("preserveWhiteSpace", () => {
    it('should apply the "mso-spacerun:yes" style to preserve whitespace', () => {
      MsOfficeUtils.preserveWhiteSpace(mockElement);
      expect(appendInlineStyleSpy).toHaveBeenCalledWith(mockElement, "mso-spacerun:yes");
    });
  });

  describe("applyTabSpacing", () => {
    it("should apply the correct mso-tab-count style for a positive count", () => {
      MsOfficeUtils.applyTabSpacing(mockElement, 3);
      expect(appendInlineStyleSpy).toHaveBeenCalledWith(mockElement, "mso-tab-count:3");
    });

    it("should handle a tab count of zero correctly", () => {
      MsOfficeUtils.applyTabSpacing(mockElement, 0);
      expect(appendInlineStyleSpy).toHaveBeenCalledWith(mockElement, "mso-tab-count:0");
    });
  });

  describe("getTabStops", () => {
    it("should return an empty string when count is 0", () => {
      expect(MsOfficeUtils.getTabStops(0)).toBe("");
    });

    it("should return the correct CSS tab-stops for multiple stops without an offset", () => {
      expect(MsOfficeUtils.getTabStops(2)).toBe("tab-stops: left 28.3465pt left 56.6930pt;");
    });

    it("should apply a positive offset to each tab stop correctly", () => {
      expect(MsOfficeUtils.getTabStops(2, 10)).toBe("tab-stops: left 38.3465pt left 66.6930pt;");
    });

    it("should apply a negative offset to each tab stop correctly", () => {
      expect(MsOfficeUtils.getTabStops(2, -5)).toBe("tab-stops: left 23.3465pt left 51.6930pt;");
    });
  });
});
