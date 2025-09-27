import { InlineStyleApplier } from "@utils/inline-style-applier";

jest.mock("@utils/utils", () => ({
  getEntries: (obj: object) => Object.entries(obj),
}));

describe("InlineStyleApplier", () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  describe("captureRootStyles", () => {
    it("should store only relevant and non-default root styles", () => {
      const root = document.createElement("div");
      root.style.color = "blue";
      root.style.fontStyle = "italic";
      root.style.fontWeight = "400"; // This matches default and should be skipped
      container.appendChild(root);

      InlineStyleApplier["rootStyleProperties"] = {}; // Reset before test
      InlineStyleApplier.captureRootStyles(root);

      expect(InlineStyleApplier["rootStyleProperties"]).toMatchObject({
        color: "blue",
        "font-style": "italic",
      });
      expect(InlineStyleApplier["rootStyleProperties"]).not.toHaveProperty("font-weight");
    });
  });

  describe("applyElementStyles", () => {
    it("should copy relevant computed styles from original to cloned element", () => {
      const original = document.createElement("span");
      original.style.fontFamily = "Courier New";
      original.style.color = "green";
      container.appendChild(original);

      const cloned = document.createElement("span");
      InlineStyleApplier.applyElementStyles(original, cloned);

      expect(cloned.style.getPropertyValue("font-family")).toBe("Courier New");
      expect(cloned.style.getPropertyValue("color")).toBe("green");
    });

    it("should not apply default values again", () => {
      const original = document.createElement("span");
      original.style.fontStyle = "normal"; // default value
      container.appendChild(original);

      const cloned = document.createElement("span");
      InlineStyleApplier.applyElementStyles(original, cloned);

      expect(cloned.style.getPropertyValue("font-style")).toBe("");
    });
  });

  describe("applyStoredRootStyles", () => {
    it("should apply stored root styles to a new element", () => {
      // Manually simulate stored styles
      InlineStyleApplier["rootStyleProperties"] = {
        color: "red",
        "font-style": "italic",
        "font-weight": "400", // default, should be ignored
      };

      const newElem = document.createElement("span");
      InlineStyleApplier.applyStoredRootStyles(newElem);

      expect(newElem.style.getPropertyValue("color")).toBe("red");
      expect(newElem.style.getPropertyValue("font-style")).toBe("italic");
      expect(newElem.style.getPropertyValue("font-weight")).toBe(""); // not applied
    });
  });
});
