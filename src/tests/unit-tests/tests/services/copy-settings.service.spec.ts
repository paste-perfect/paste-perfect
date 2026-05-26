import { describe, it, expect } from "vitest";
import { TestBed } from "@angular/core/testing";
import { CopySettingsService } from "@services/copy-settings.service";
import { CopyMode, DEFAULT_COPY_SETTINGS, DEFAULT_COPY_FONT_SIZE, DEFAULT_COPY_TAB_SIZE } from "@types";
import { useStandardTeardown } from "../../test-utils/utils";

const createService = () => {
  TestBed.configureTestingModule({ providers: [CopySettingsService] });
  return TestBed.inject(CopySettingsService);
};

describe("CopySettingsService", () => {
  useStandardTeardown();

  it("should be created", () => {
    expect(createService()).toBeTruthy();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  describe("initial state", () => {
    it("should start with HTML copy mode", () => {
      expect(createService().copySettings.copyMode).toBe(CopyMode.HTML);
    });

    it("should start with default font size", () => {
      expect(createService().copySettings.fontSize).toBe(DEFAULT_COPY_FONT_SIZE);
    });

    it("should start with default tab size", () => {
      expect(createService().copySettings.tabSize).toBe(DEFAULT_COPY_TAB_SIZE);
    });

    it("should start with MS Office optimizations enabled", () => {
      const s = createService();
      expect(s.copySettings.inlineStylesForOffice).toBe(true);
      expect(s.copySettings.adjustIndentationForOffice).toBe(true);
    });

    it("should match DEFAULT_COPY_SETTINGS exactly", () => {
      expect(createService().copySettings).toEqual(DEFAULT_COPY_SETTINGS);
    });
  });

  // ── updateSettings ─────────────────────────────────────────────────────────

  describe("updateSettings", () => {
    it("should apply a partial update without touching other fields", () => {
      const service = createService();
      service.updateSettings({ copyMode: CopyMode.PlainText });
      expect(service.copySettings).toEqual({ ...DEFAULT_COPY_SETTINGS, copyMode: CopyMode.PlainText });
    });

    it("should reflect the latest value after multiple updates", () => {
      const service = createService();
      service.updateSettings({ fontSize: 16 });
      service.updateSettings({ tabSize: 2 });
      expect(service.copySettings.fontSize).toBe(16);
      expect(service.copySettings.tabSize).toBe(2);
    });

    it("should not mutate the previous settings reference (immutability)", () => {
      const service = createService();
      const before = service.copySettings;
      service.updateSettings({ fontSize: 20 });
      expect(service.copySettings).not.toBe(before);
    });

    it("should not persist settings to localStorage", () => {
      const service = createService();
      service.updateSettings({ fontSize: 20 });
      expect(localStorage.getItem("editor_settings")).toBeNull();
      // Confirm no copy-settings key was written either
      expect(Object.keys(localStorage)).not.toContain("copy_settings");
    });
  });

  // ── resetToDefaults ────────────────────────────────────────────────────────

  describe("resetToDefaults", () => {
    it("should restore all fields to factory defaults", () => {
      const service = createService();
      service.updateSettings({ copyMode: CopyMode.PlainText, fontSize: 20, tabSize: 8 });
      service.resetToDefaults();
      expect(service.copySettings).toEqual(DEFAULT_COPY_SETTINGS);
    });
  });

  // ── isHtmlMode ─────────────────────────────────────────────────────────────

  describe("isHtmlMode", () => {
    it("should return true when copy mode is HTML", () => {
      expect(createService().isHtmlMode()).toBe(true);
    });

    it("should return false when copy mode is PlainText", () => {
      const service = createService();
      service.updateSettings({ copyMode: CopyMode.PlainText });
      expect(service.isHtmlMode()).toBe(false);
    });
  });

  // ── hasNonDefaultSettings ──────────────────────────────────────────────────

  describe("hasNonDefaultSettings", () => {
    it("should return false when all settings are at their defaults", () => {
      expect(createService().hasNonDefaultSettings()).toBe(false);
    });

    it("should return true when copyMode differs from default", () => {
      const service = createService();
      service.updateSettings({ copyMode: CopyMode.PlainText });
      expect(service.hasNonDefaultSettings()).toBe(true);
    });

    it("should return true when fontSize differs from default", () => {
      const service = createService();
      service.updateSettings({ fontSize: 18 });
      expect(service.hasNonDefaultSettings()).toBe(true);
    });

    it("should return true when tabSize differs from default", () => {
      const service = createService();
      service.updateSettings({ tabSize: 2 });
      expect(service.hasNonDefaultSettings()).toBe(true);
    });

    it("should return true when inlineStylesForOffice is disabled", () => {
      const service = createService();
      service.updateSettings({ inlineStylesForOffice: false });
      expect(service.hasNonDefaultSettings()).toBe(true);
    });

    it("should return true when adjustIndentationForOffice is disabled", () => {
      const service = createService();
      service.updateSettings({ adjustIndentationForOffice: false });
      expect(service.hasNonDefaultSettings()).toBe(true);
    });

    it("should return false after resetting to defaults", () => {
      const service = createService();
      service.updateSettings({ fontSize: 20, copyMode: CopyMode.PlainText });
      service.resetToDefaults();
      expect(service.hasNonDefaultSettings()).toBe(false);
    });
  });

  // ── getActiveChips ─────────────────────────────────────────────────────────

  describe("getActiveChips", () => {
    it("should return an empty array when all settings are at their defaults", () => {
      expect(createService().getActiveChips()).toHaveLength(0);
    });

    it("should add a 'Plain Text' chip when copy mode is PlainText", () => {
      const service = createService();
      service.updateSettings({ copyMode: CopyMode.PlainText });
      const chips = service.getActiveChips();
      expect(chips).toContainEqual(expect.objectContaining({ label: "Plain Text", key: "copyMode" }));
    });

    it("should add a font size chip when fontSize differs from default", () => {
      const service = createService();
      service.updateSettings({ fontSize: 18 });
      const chips = service.getActiveChips();
      expect(chips).toContainEqual(expect.objectContaining({ label: "Font: 18px", key: "fontSize" }));
    });

    it("should add a tab size chip when tabSize differs from default", () => {
      const service = createService();
      service.updateSettings({ tabSize: 2 });
      const chips = service.getActiveChips();
      expect(chips).toContainEqual(expect.objectContaining({ label: "Tab: 2", key: "tabSize" }));
    });

    it("should add a 'No Office Styles' chip when inlineStylesForOffice is false", () => {
      const service = createService();
      service.updateSettings({ inlineStylesForOffice: false });
      const chips = service.getActiveChips();
      expect(chips).toContainEqual(expect.objectContaining({ label: "No Office Styles", key: "inlineStylesForOffice" }));
    });

    it("should add a 'No Office Indent' chip when adjustIndentationForOffice is false", () => {
      const service = createService();
      service.updateSettings({ adjustIndentationForOffice: false });
      const chips = service.getActiveChips();
      expect(chips).toContainEqual(expect.objectContaining({ label: "No Office Indent", key: "adjustIndentationForOffice" }));
    });

    it("should accumulate multiple chips for multiple non-default settings", () => {
      const service = createService();
      service.updateSettings({ copyMode: CopyMode.PlainText, fontSize: 16, tabSize: 2 });
      expect(service.getActiveChips()).toHaveLength(3);
    });

    it("should return an empty array after resetting to defaults", () => {
      const service = createService();
      service.updateSettings({ copyMode: CopyMode.PlainText, fontSize: 16 });
      service.resetToDefaults();
      expect(service.getActiveChips()).toHaveLength(0);
    });
  });
});
