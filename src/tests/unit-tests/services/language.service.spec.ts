import { describe, it, expect, afterEach, vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { LANGUAGE_STORAGE_KEY, POPULAR_LANGUAGES } from "@constants";
import { LanguageService } from "@services/language.service";
import { StorageService } from "@services/storage.service";
import { createStorageMock } from "../test-utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createService = (storedValue: string | null = null) => {
  const storageMock = createStorageMock(storedValue);

  TestBed.configureTestingModule({
    providers: [LanguageService, { provide: StorageService, useValue: storageMock }],
  });

  return { service: TestBed.inject(LanguageService), storageMock };
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("LanguageService", () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it("should be created", () => {
    const { service } = createService();
    expect(service).toBeTruthy();
  });

  describe("initial language resolution", () => {
    it("should default to the first popular language when storage is empty", () => {
      const { service } = createService(null);
      expect(service.selectedLanguage).toEqual(POPULAR_LANGUAGES[0]);
    });

    it("should restore the previously stored language on initialisation", () => {
      const stored = POPULAR_LANGUAGES[1];
      const { service } = createService(stored.value);
      expect(service.selectedLanguage).toEqual(stored);
    });

    it("should fall back to the first popular language when storage returns an unknown value", () => {
      const { service } = createService("__unknown_language__");
      expect(service.selectedLanguage).toEqual(POPULAR_LANGUAGES[0]);
    });
  });

  describe("selectedLanguageValue getter", () => {
    it("should return the value string of the currently selected language", () => {
      const { service } = createService();
      expect(service.selectedLanguageValue).toBe(POPULAR_LANGUAGES[0].value);
    });
  });

  describe("selectedLanguageValue setter", () => {
    it("should persist the new language value to storage", () => {
      const { service, storageMock } = createService();
      const target = POPULAR_LANGUAGES[1];

      service.selectedLanguageValue = target.value;

      expect(storageMock.setItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY, target.value);
    });

    it("should update the selected language signal when a valid value is set", () => {
      const { service } = createService();
      const target = POPULAR_LANGUAGES[1];

      service.selectedLanguageValue = target.value;

      expect(service.selectedLanguage).toEqual(target);
    });

    it("should not update the selected language signal when the value is unknown", () => {
      const { service } = createService();
      const before = service.selectedLanguage;

      service.selectedLanguageValue = "__not_a_real_language__";

      expect(service.selectedLanguage).toEqual(before);
    });
  });

  describe("isPrettierSupportedByLanguage computed signal", () => {
    it("should return true when the selected language has a prettierConfiguration", () => {
      const { service } = createService();
      const prettierLanguage = POPULAR_LANGUAGES.find((l) => !!l.prettierConfiguration);
      if (!prettierLanguage) return;

      service.selectedLanguageValue = prettierLanguage.value;

      expect(service.isPrettierSupportedByLanguage()).toBe(true);
    });

    it("should return false when the selected language has no prettierConfiguration", () => {
      const { service } = createService();
      const nonPrettierLanguage = POPULAR_LANGUAGES.find((l) => !l.prettierConfiguration);
      if (!nonPrettierLanguage) return;

      service.selectedLanguageValue = nonPrettierLanguage.value;

      expect(service.isPrettierSupportedByLanguage()).toBe(false);
    });
  });
});
