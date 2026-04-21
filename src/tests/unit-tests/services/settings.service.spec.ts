import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { INDENTATION_MODE_MAP, IndentationMode, SETTINGS_STORAGE_KEY } from "@constants";
import { HighlightingSettings } from "@types";
import { SettingsService } from "@services/settings.service";
import { StorageService } from "@services/storage.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: HighlightingSettings = {
  indentationSize: 2,
  indentationMode: IndentationMode.Spaces,
  enableFormatting: true,
  showLineNumbers: false,
};

const mockStorageService = (stored: HighlightingSettings | null = null) => ({
  getItem: vi.fn().mockReturnValue(stored),
  setItem: vi.fn(),
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("SettingsService", () => {
  let service: SettingsService;
  let storageMock: ReturnType<typeof mockStorageService>;

  beforeEach(() => {
    storageMock = mockStorageService();

    TestBed.configureTestingModule({
      providers: [SettingsService, { provide: StorageService, useValue: storageMock }],
    });

    service = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  // ── Instantiation ──────────────────────────────────────────────────────────

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // ── Initial settings resolution ────────────────────────────────────────────

  describe("initial settings resolution", () => {
    it("should initialise with hard-coded defaults when storage is empty", () => {
      expect(service.editorSettings).toEqual(DEFAULT_SETTINGS);
    });

    it("should merge stored values over the defaults on initialisation", () => {
      const stored: Partial<HighlightingSettings> = {
        indentationSize: 4,
        showLineNumbers: true,
      };
      storageMock = mockStorageService(stored as HighlightingSettings);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [SettingsService, { provide: StorageService, useValue: storageMock }],
      });
      const freshService = TestBed.inject(SettingsService);

      expect(freshService.editorSettings).toEqual({
        ...DEFAULT_SETTINGS,
        ...stored,
      });
    });
  });

  // ── editorSettings getter ─────────────────────────────────────────────────

  describe("editorSettings getter", () => {
    it("should expose the current settings object", () => {
      expect(service.editorSettings).toBeDefined();
      expect(typeof service.editorSettings.indentationSize).toBe("number");
    });
  });

  // ── updateSettings ────────────────────────────────────────────────────────

  describe("updateSettings", () => {
    it("should apply a partial update and leave unchanged fields intact", () => {
      service.updateSettings({ indentationSize: 4 });
      expect(service.editorSettings).toEqual({
        ...DEFAULT_SETTINGS,
        indentationSize: 4,
      });
    });

    it("should persist the merged settings object to storage on every update", () => {
      service.updateSettings({ showLineNumbers: true });
      expect(storageMock.setItem).toHaveBeenCalledWith(SETTINGS_STORAGE_KEY, expect.objectContaining({ showLineNumbers: true }));
    });

    it("should reflect the latest value after multiple successive updates", () => {
      service.updateSettings({ indentationSize: 4 });
      service.updateSettings({ indentationMode: IndentationMode.Tabs });
      expect(service.editorSettings.indentationSize).toBe(4);
      expect(service.editorSettings.indentationMode).toBe(IndentationMode.Tabs);
    });

    it("should not mutate the previous settings reference (immutability)", () => {
      const before = service.editorSettings;
      service.updateSettings({ indentationSize: 8 });
      expect(service.editorSettings).not.toBe(before);
    });
  });

  // ── getAvailableIndentationModes ──────────────────────────────────────────

  describe("getAvailableIndentationModes", () => {
    it("should return the same number of modes as entries in INDENTATION_MODE_MAP", () => {
      const modes = service.getAvailableIndentationModes();
      expect(modes).toHaveLength(Object.keys(INDENTATION_MODE_MAP).length);
    });

    it("should return a copy — mutating the result must not affect the internal list", () => {
      const first = service.getAvailableIndentationModes();
      first.push({ value: "hack" as IndentationMode, label: "Hack" });
      const second = service.getAvailableIndentationModes();
      expect(second).toHaveLength(Object.keys(INDENTATION_MODE_MAP).length);
    });

    it("should include entries with both a value and a label", () => {
      service.getAvailableIndentationModes().forEach((mode) => {
        expect(mode.value).toBeTruthy();
        expect(mode.label).toBeTruthy();
      });
    });
  });
});
