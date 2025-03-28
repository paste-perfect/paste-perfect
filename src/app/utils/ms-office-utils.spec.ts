import { NodeUtils } from "@utils/node-utils";
import { SpecialCharacters } from "../constants";
import { MsOfficeUtils } from "@utils/ms-office-utils";

// Create mock elements for testing
let mockElement: HTMLElement;

beforeEach(() => {
  mockElement = document.createElement("div");
  jest.clearAllMocks();
});

// Mock NodeUtils methods
jest.mock("@utils/node-utils", () => ({
  NodeUtils: {
    createSpanWithTextContent: jest.fn(),
    appendInlineStyle: jest.fn(),
  },
}));

describe("OfficeUtils", () => {
  describe("createEmptyLineSpan", () => {
    it("should create a span with a non-breaking space and preserve whitespace", () => {
      const mockSpan = document.createElement("span");
      (NodeUtils.createSpanWithTextContent as jest.Mock).mockReturnValue(mockSpan);

      const result = MsOfficeUtils.createEmptyLineSpan();

      expect(NodeUtils.createSpanWithTextContent).toHaveBeenCalledWith(SpecialCharacters.NON_BREAKING_SPACE);
      expect(NodeUtils.appendInlineStyle).toHaveBeenCalledWith(mockSpan, "mso-spacerun:yes");
      expect(result).toBe(mockSpan);
    });
  });

  describe("applyNoMarginStyle", () => {
    it("should apply no margin style to element", () => {
      MsOfficeUtils.applyNoMarginStyle(mockElement);

      expect(NodeUtils.appendInlineStyle).toHaveBeenCalledWith(mockElement, "margin:0cm;");
    });
  });

  describe("preserveWhiteSpace", () => {
    it("should apply mso-spacerun style to preserve whitespace", () => {
      MsOfficeUtils.preserveWhiteSpace(mockElement);

      expect(NodeUtils.appendInlineStyle).toHaveBeenCalledWith(mockElement, "mso-spacerun:yes");
    });
  });

  describe("applyTabSpacing", () => {
    it("should apply tab count style to element", () => {
      MsOfficeUtils.applyTabSpacing(mockElement, 3);

      expect(NodeUtils.appendInlineStyle).toHaveBeenCalledWith(mockElement, "mso-tab-count:3");
    });

    it("should handle 0 tabCount correctly", () => {
      MsOfficeUtils.applyTabSpacing(mockElement, 0);

      expect(NodeUtils.appendInlineStyle).toHaveBeenCalledWith(mockElement, "mso-tab-count:0");
    });
  });
});
