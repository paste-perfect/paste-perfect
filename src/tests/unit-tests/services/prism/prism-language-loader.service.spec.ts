import { vi, describe, it, expect, beforeEach, afterEach, type MockInstance } from "vitest";
import { TestBed } from "@angular/core/testing";
import { PrismLanguageLoaderService } from "@services/prism/prism-language-loader.service";
import { MessageService } from "primeng/api";
import { LocationStrategy } from "@angular/common";
import { LanguageDefinition } from "@types";
import { makeLanguage, createMessageMock } from "../../test-utils";

// ---------------------------------------------------------------------------
// 1. Hoisted shared state
// ---------------------------------------------------------------------------

const prismMock = vi.hoisted(() => ({
  languages: {} as Record<string, unknown>,
  highlight: vi.fn(),
}));

const mockSearchLanguage = vi.hoisted(() => vi.fn());

// ---------------------------------------------------------------------------
// 2. Module-level mocks
// ---------------------------------------------------------------------------

vi.mock("prismjs", () => ({
  default: prismMock,
  get languages() {
    return prismMock.languages;
  },
  get highlight() {
    return prismMock.highlight;
  },
}));

vi.mock("@utils/languages-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@utils/languages-utils")>();
  return { ...actual, searchLanguageByValue: mockSearchLanguage };
});

// ---------------------------------------------------------------------------
// 3. Test Suite
// ---------------------------------------------------------------------------

describe("PrismLanguageLoaderService", () => {
  let service: PrismLanguageLoaderService;
  let importLanguageSpy: MockInstance;

  const messageServiceMock = createMessageMock();
  const locationStrategyMock = { getBaseHref: vi.fn().mockReturnValue("/") };

  beforeEach(() => {
    Object.keys(prismMock.languages).forEach((key) => delete prismMock.languages[key]);

    TestBed.configureTestingModule({
      providers: [
        PrismLanguageLoaderService,
        { provide: MessageService, useValue: messageServiceMock },
        { provide: LocationStrategy, useValue: locationStrategyMock },
      ],
    });

    service = TestBed.inject(PrismLanguageLoaderService);
    importLanguageSpy = vi.spyOn(service as any, "importLanguage").mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("loadPrismLanguage", () => {
    it("should do nothing when language value is an empty string", async () => {
      await service.loadPrismLanguage(makeLanguage("") as LanguageDefinition);
      expect(importLanguageSpy).not.toHaveBeenCalled();
    });

    it("should do nothing when language is falsy (null)", async () => {
      await service.loadPrismLanguage(null as unknown as LanguageDefinition);
      expect(importLanguageSpy).not.toHaveBeenCalled();
    });

    it("should do nothing when the language is already registered in Prism", async () => {
      prismMock.languages["typescript"] = { tokenize: () => [] };

      await service.loadPrismLanguage(makeLanguage("typescript"));

      expect(importLanguageSpy).not.toHaveBeenCalled();
    });

    it("should call importLanguage when the language is not yet registered", async () => {
      importLanguageSpy.mockResolvedValue(undefined);

      await service.loadPrismLanguage(makeLanguage("python"));

      expect(importLanguageSpy).toHaveBeenCalledWith(expect.objectContaining({ value: "python" }));
    });

    it("should load each dependency before loading the main language", async () => {
      const callOrder: string[] = [];
      importLanguageSpy.mockImplementation(async (...args: unknown[]) => {
        const lang = args[0] as LanguageDefinition;
        callOrder.push(lang.value);
      });

      mockSearchLanguage.mockReturnValue(makeLanguage("markup"));

      await service.loadPrismLanguage(makeLanguage("jsx", ["markup"]));

      expect(callOrder[0]).toBe("markup");
      expect(callOrder[1]).toBe("jsx");
    });

    it("should show an error toast (not throw) when importLanguage rejects", async () => {
      importLanguageSpy.mockRejectedValue(new Error("import failed"));
      vi.spyOn(console, "error").mockImplementation(() => {
        /* empty */
      });

      await expect(service.loadPrismLanguage(makeLanguage("rust"))).resolves.toBeUndefined();

      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ severity: "error", summary: "Language loading failed" })
      );
    });

    it("should show a warning toast when a declared dependency cannot be found", async () => {
      mockSearchLanguage.mockReturnValue(undefined);
      importLanguageSpy.mockResolvedValue(undefined);
      vi.spyOn(console, "warn").mockImplementation(() => {
        /* empty */
      });

      await service.loadPrismLanguage(makeLanguage("jsx", ["unknown-dep"]));

      expect(messageServiceMock.add).toHaveBeenCalledWith(expect.objectContaining({ severity: "warn", summary: "Missing Dependency" }));
    });

    it("should skip already-loaded dependencies (already in Prism.languages)", async () => {
      importLanguageSpy.mockResolvedValue(undefined);
      prismMock.languages["markup"] = {};
      mockSearchLanguage.mockReturnValue(makeLanguage("markup"));

      await service.loadPrismLanguage(makeLanguage("jsx", ["markup"]));

      expect(importLanguageSpy).toHaveBeenCalledTimes(1);
      expect(importLanguageSpy).toHaveBeenCalledWith(expect.objectContaining({ value: "jsx" }));
    });
  });

  describe("importLanguage", () => {
    it("should use the customImportPath when one is defined", async () => {
      const dynamicImportLanguageSpy = vi.fn().mockResolvedValue({});

      importLanguageSpy.mockImplementationOnce(async (...args: unknown[]) => {
        const lang = args[0] as LanguageDefinition;
        if (lang.prismConfiguration.customImportPath) {
          await dynamicImportLanguageSpy(`/${lang.prismConfiguration.customImportPath}`);
        }
      });

      await (service as any).importLanguage(makeLanguage("custom-lang", [], "assets/prism-custom.js"));

      expect(dynamicImportLanguageSpy).toHaveBeenCalledWith("/assets/prism-custom.js");
    });

    it("should show an error toast and rethrow when the dynamic import fails", async () => {
      const importError = new Error("module not found");
      vi.spyOn(console, "error").mockImplementation(() => {
        /* empty */
      });

      importLanguageSpy.mockRejectedValue(importError);

      await expect((service as any).importLanguage(makeLanguage("nonexistent"))).rejects.toThrow("module not found");
    });
  });
});
