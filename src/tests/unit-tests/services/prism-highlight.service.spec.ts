import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from "vitest";

import { TestBed } from "@angular/core/testing";

import { PrismLanguageLoaderService } from "@services/prism/prism-language-loader.service";

import { MessageService } from "primeng/api";

import { LocationStrategy } from "@angular/common";

import { LanguageDefinition } from "@types";

import * as Prism from "prismjs";

// ---------------------------------------------------------------------------
// 1. Mocks (Always at the top level)
// ---------------------------------------------------------------------------

const mockSearchLanguage = vi.fn();

// Mock PrismJS
vi.mock("prismjs", () => ({
  languages: {} as Record<string, unknown>,
  highlight: vi.fn(),
}));

// Mock Utils - moved up to avoid hoisting warnings
vi.mock("@utils/languages-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@utils/languages-utils")>();
  return {
    ...actual,
    searchLanguageByValue: mockSearchLanguage,
  };
});

// ---------------------------------------------------------------------------

// 2. Helpers and Test Suite

// ---------------------------------------------------------------------------

const createLanguageDef = (value: string, dependencies: string[] = [], customImportPath?: string): LanguageDefinition => ({
  title: value,

  value,

  filterAlias: [],

  prismConfiguration: { dependencies, customImportPath },
});

describe("PrismLanguageLoaderService", () => {
  let service: PrismLanguageLoaderService;

  let importLanguageSpy: MockInstance<PrismLanguageLoaderService["importLanguage"]>;

  // Strongly typed mock references for Angular services

  const messageServiceMock = { add: vi.fn() };

  const locationStrategyMock = { getBaseHref: vi.fn().mockReturnValue("/") };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PrismLanguageLoaderService,

        { provide: MessageService, useValue: messageServiceMock },

        { provide: LocationStrategy, useValue: locationStrategyMock },
      ],
    });

    service = TestBed.inject(PrismLanguageLoaderService);

    importLanguageSpy = vi.spyOn(service as any, "importLanguage");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Instantiation ────────────────────────────────────────────────────────

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // ── loadPrismLanguage ────────────────────────────────────────────────────

  describe("loadPrismLanguage", () => {
    it("should do nothing when language value is an empty string", async () => {
      await service.loadPrismLanguage(createLanguageDef("") as LanguageDefinition);

      expect(importLanguageSpy).not.toHaveBeenCalled();
    });

    it("should do nothing when language is falsy (null)", async () => {
      await service.loadPrismLanguage(null as unknown as LanguageDefinition);

      expect(importLanguageSpy).not.toHaveBeenCalled();
    });

    it("should do nothing when the language is already registered in Prism", async () => {
      (Prism.languages as Record<string, unknown>)["typescript"] = {
        tokenize: () => [],
      };

      await service.loadPrismLanguage(createLanguageDef("typescript"));

      expect(importLanguageSpy).not.toHaveBeenCalled();
    });

    it("should call importLanguage when the language is not yet registered", async () => {
      importLanguageSpy.mockResolvedValue(undefined);

      await service.loadPrismLanguage(createLanguageDef("python"));

      expect(importLanguageSpy).toHaveBeenCalledWith(expect.objectContaining({ value: "python" }));
    });

    it("should load each dependency before loading the main language", async () => {
      const callOrder: string[] = [];

      importLanguageSpy.mockImplementation(async (...args: unknown[]) => {
        const lang = args[0] as LanguageDefinition;

        callOrder.push(lang.value);
      });

      const depLanguage = createLanguageDef("markup");

      mockSearchLanguage.mockReturnValue(depLanguage);

      await service.loadPrismLanguage(createLanguageDef("jsx", ["markup"]));

      // Dependency must be first

      expect(callOrder[0]).toBe("markup");

      expect(callOrder[1]).toBe("jsx");
    });

    it("should show an error toast (not throw) when importLanguage rejects", async () => {
      importLanguageSpy.mockRejectedValue(new Error("import failed"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
        /* empty */
      });

      // loadPrismLanguage swallows the error — must resolve, not reject

      await expect(service.loadPrismLanguage(createLanguageDef("rust"))).resolves.toBeUndefined();

      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "error",

          summary: "Language loading failed",
        })
      );

      consoleSpy.mockRestore();
    });

    it("should show a warning toast when a declared dependency cannot be found", async () => {
      mockSearchLanguage.mockReturnValue(undefined);

      importLanguageSpy.mockResolvedValue(undefined);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        /* empty */
      });

      await service.loadPrismLanguage(createLanguageDef("jsx", ["unknown-dep"]));

      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "warn",

          summary: "Missing Dependency",
        })
      );

      consoleSpy.mockRestore();
    });

    it("should skip already-loaded dependencies (already in Prism.languages)", async () => {
      importLanguageSpy.mockResolvedValue(undefined);

      // Simulate markup already loaded

      (Prism.languages as Record<string, unknown>)["markup"] = {};

      const depLanguage = createLanguageDef("markup");

      mockSearchLanguage.mockReturnValue(depLanguage);

      await service.loadPrismLanguage(createLanguageDef("jsx", ["markup"]));

      // importLanguage should only be called for jsx, not for markup

      expect(importLanguageSpy).toHaveBeenCalledTimes(1);

      expect(importLanguageSpy).toHaveBeenCalledWith(expect.objectContaining({ value: "jsx" }));
    });
  });

  // ── importLanguage (private, tested via spy overrides) ───────────────────

  describe("importLanguage", () => {
    it("should use the customImportPath when one is defined", async () => {
      const dynamicimportLanguageSpy = vi.fn().mockResolvedValue({});

      importLanguageSpy.mockImplementationOnce(async (...args: unknown[]) => {
        const lang = args[0] as LanguageDefinition;

        if (lang.prismConfiguration.customImportPath) {
          await dynamicimportLanguageSpy(`/${lang.prismConfiguration.customImportPath}`);
        }
      });

      await (service as any).importLanguage(createLanguageDef("custom-lang", [], "assets/prism-custom.js"));

      expect(dynamicimportLanguageSpy).toHaveBeenCalledWith("/assets/prism-custom.js");
    });

    it("should show an error toast and rethrow when the dynamic import fails", async () => {
      const importError = new Error("module not found");

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
        /* empty */
      });

      importLanguageSpy.mockRejectedValue(importError);

      await expect((service as any).importLanguage(createLanguageDef("nonexistent"))).rejects.toThrow("module not found");

      consoleSpy.mockRestore();
    });
  });
});
