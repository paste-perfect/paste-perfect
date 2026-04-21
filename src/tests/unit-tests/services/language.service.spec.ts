import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { LANGUAGE_STORAGE_KEY, POPULAR_LANGUAGES } from "@constants";
import { LanguageService } from "@services/language.service";
import { StorageService } from "@services/storage.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockStorageService = () => ({
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("LanguageService", () => {
  let service: LanguageService;
  let storageMock: ReturnType<typeof mockStorageService>;

  beforeEach(() => {
    storageMock = mockStorageService();

    TestBed.configureTestingModule({
      providers: [LanguageService, { provide: StorageService, useValue: storageMock }],
    });

    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  // ── Instantiation ──────────────────────────────────────────────────────────

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // ── Initial language resolution ────────────────────────────────────────────

  describe("initial language resolution", () => {
    it("should default to the first popular language when storage is empty", () => {
      expect(service.selectedLanguage).toEqual(POPULAR_LANGUAGES[0]);
    });

    it("should restore the previously stored language on initialisation", () => {
      const storedLanguage = POPULAR_LANGUAGES[1];
      storageMock.getItem.mockReturnValue(storedLanguage.value);

      // Re-bootstrap so the constructor picks up the mocked storage value
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [LanguageService, { provide: StorageService, useValue: storageMock }],
      });
      const freshService = TestBed.inject(LanguageService);

      expect(freshService.selectedLanguage).toEqual(storedLanguage);
    });

    it("should fall back to the first popular language when storage returns an unknown value", () => {
      storageMock.getItem.mockReturnValue("__unknown_language__");

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [LanguageService, { provide: StorageService, useValue: storageMock }],
      });
      const freshService = TestBed.inject(LanguageService);

      expect(freshService.selectedLanguage).toEqual(POPULAR_LANGUAGES[0]);
    });
  });

  // ── selectedLanguageValue (getter) ────────────────────────────────────────

  describe("selectedLanguageValue getter", () => {
    it("should return the value string of the currently selected language", () => {
      expect(service.selectedLanguageValue).toBe(POPULAR_LANGUAGES[0].value);
    });
  });

  // ── selectedLanguageValue (setter) ────────────────────────────────────────

  describe("selectedLanguageValue setter", () => {
    it("should persist the new language value to storage", () => {
      const target = POPULAR_LANGUAGES[1];
      service.selectedLanguageValue = target.value;
      expect(storageMock.setItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY, target.value);
    });

    it("should update the selected language signal when a valid value is set", () => {
      const target = POPULAR_LANGUAGES[1];
      service.selectedLanguageValue = target.value;
      expect(service.selectedLanguage).toEqual(target);
    });

    it("should not update the selected language signal when the value is unknown", () => {
      const before = service.selectedLanguage;
      service.selectedLanguageValue = "__not_a_real_language__";
      expect(service.selectedLanguage).toEqual(before);
    });
  });

  // ── isPrettierSupportedByLanguage ─────────────────────────────────────────

  describe("isPrettierSupportedByLanguage computed signal", () => {
    it("should return true when the selected language has a prettierConfiguration", () => {
      // Find a language that has prettier support
      const prettierLanguage = POPULAR_LANGUAGES.find((l) => !!l.prettierConfiguration);
      if (!prettierLanguage) return; // skip if none configured

      service.selectedLanguageValue = prettierLanguage.value;
      expect(service.isPrettierSupportedByLanguage()).toBe(true);
    });

    it("should return false when the selected language has no prettierConfiguration", () => {
      const nonPrettierLanguage = POPULAR_LANGUAGES.find((l) => !l.prettierConfiguration);
      if (!nonPrettierLanguage) return; // skip if all have prettier

      service.selectedLanguageValue = nonPrettierLanguage.value;
      expect(service.isPrettierSupportedByLanguage()).toBe(false);
    });
  });
});
