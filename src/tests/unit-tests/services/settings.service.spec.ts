import { describe, it, expect, afterEach, vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { INDENTATION_MODE_MAP, IndentationMode, SETTINGS_STORAGE_KEY } from "@constants";
import { HighlightingSettings } from "@types";
import { SettingsService } from "@services/settings.service";
import { StorageService } from "@services/storage.service";
import { createStorageMock } from "../test-utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: HighlightingSettings = {
  indentationSize: 2,
  indentationMode: IndentationMode.Spaces,
  enableFormatting: true,
  showLineNumbers: false,
};

const createService = (stored: HighlightingSettings | null = null) => {
  const storageMock = createStorageMock(stored);

  TestBed.configureTestingModule({
    providers: [SettingsService, { provide: StorageService, useValue: storageMock }],
  });

  return { service: TestBed.inject(SettingsService), storageMock };
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("SettingsService", () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it("should be created", () => {
    const { service } = createService();
    expect(service).toBeTruthy();
  });

  describe("initial settings resolution", () => {
    it("should initialise with hard-coded defaults when storage is empty", () => {
      const { service } = createService(null);
      expect(service.editorSettings).toEqual(DEFAULT_SETTINGS);
    });

    it("should merge stored values over the defaults on initialisation", () => {
      const stored: Partial<HighlightingSettings> = { indentationSize: 4, showLineNumbers: true };
      const { service } = createService(stored as HighlightingSettings);

      expect(service.editorSettings).toEqual({ ...DEFAULT_SETTINGS, ...stored });
    });
  });

  describe("editorSettings getter", () => {
    it("should expose the current settings object", () => {
      const { service } = createService();
      expect(service.editorSettings).toBeDefined();
      expect(typeof service.editorSettings.indentationSize).toBe("number");
    });
  });

  describe("updateSettings", () => {
    it("should apply a partial update and leave unchanged fields intact", () => {
      const { service } = createService();
      service.updateSettings({ indentationSize: 4 });
      expect(service.editorSettings).toEqual({ ...DEFAULT_SETTINGS, indentationSize: 4 });
    });

    it("should persist the merged settings object to storage on every update", () => {
      const { service, storageMock } = createService();
      service.updateSettings({ showLineNumbers: true });
      expect(storageMock.setItem).toHaveBeenCalledWith(SETTINGS_STORAGE_KEY, expect.objectContaining({ showLineNumbers: true }));
    });

    it("should reflect the latest value after multiple successive updates", () => {
      const { service } = createService();
      service.updateSettings({ indentationSize: 4 });
      service.updateSettings({ indentationMode: IndentationMode.Tabs });
      expect(service.editorSettings.indentationSize).toBe(4);
      expect(service.editorSettings.indentationMode).toBe(IndentationMode.Tabs);
    });

    it("should not mutate the previous settings reference (immutability)", () => {
      const { service } = createService();
      const before = service.editorSettings;
      service.updateSettings({ indentationSize: 8 });
      expect(service.editorSettings).not.toBe(before);
    });
  });

  describe("getAvailableIndentationModes", () => {
    it("should return the same number of modes as entries in INDENTATION_MODE_MAP", () => {
      const { service } = createService();
      expect(service.getAvailableIndentationModes()).toHaveLength(Object.keys(INDENTATION_MODE_MAP).length);
    });

    it("should return a copy — mutating the result must not affect the internal list", () => {
      const { service } = createService();
      const first = service.getAvailableIndentationModes();
      first.push({ value: "hack" as IndentationMode, label: "Hack" });
      const second = service.getAvailableIndentationModes();
      expect(second).toHaveLength(Object.keys(INDENTATION_MODE_MAP).length);
    });

    it("should include entries with both a value and a label", () => {
      const { service } = createService();
      service.getAvailableIndentationModes().forEach((mode) => {
        expect(mode.value).toBeTruthy();
        expect(mode.label).toBeTruthy();
      });
    });
  });
});
