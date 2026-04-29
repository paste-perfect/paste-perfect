import { vi, describe, it, expect, beforeEach, afterEach, type MockInstance } from "vitest";
import { TestBed } from "@angular/core/testing";
import { PrismLanguageLoaderService } from "@services/prism/prism-language-loader.service";
import { MessageService } from "primeng/api";
import { LocationStrategy } from "@angular/common";
import { LanguageDefinition } from "@types";
import { createMessageMock, makeLanguage } from "../../../test-utils/utils";
import { ALL_LANGUAGES } from "@constants/languages";
import { PRETTIER_LANGUAGE_MAP } from "@constants/prettier-language-map";

// ---------------------------------------------------------------------------
// Hoisted mocks (evaluated before any imports)
// ---------------------------------------------------------------------------

const prismMock = vi.hoisted(() => ({
  languages: {} as Record<string, unknown>,
  highlight: vi.fn(),
}));

const mockSearchLanguage = vi.hoisted(() => vi.fn());

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
// Helpers
// ---------------------------------------------------------------------------

/** Wipes all keys added to prismMock.languages between tests. */
function resetPrismLanguages() {
  Object.keys(prismMock.languages).forEach((key) => delete prismMock.languages[key]);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("PrismLanguageLoaderService", () => {
  let service: PrismLanguageLoaderService;
  let importLanguageSpy: MockInstance;

  it("asdf", () => {
    console.log(ALL_LANGUAGES.map((l) => l.value));
    console.log(PRETTIER_LANGUAGE_MAP);
  });

  // Stable mock objects — reset their call history in beforeEach, not recreated.
  const messageServiceMock = createMessageMock();
  const locationStrategyMock = { getBaseHref: vi.fn().mockReturnValue("/") };

  beforeEach(() => {
    // Reset all mock call histories and implementations set in previous test.
    mockSearchLanguage.mockReset();
    vi.mocked(messageServiceMock.add).mockReset();
    resetPrismLanguages();

    TestBed.configureTestingModule({
      providers: [
        PrismLanguageLoaderService,
        { provide: MessageService, useValue: messageServiceMock },
        { provide: LocationStrategy, useValue: locationStrategyMock },
      ],
    });

    service = TestBed.inject(PrismLanguageLoaderService);

    // Spy on the private method so loadPrismLanguage tests remain unit-focused.
    // The mock simulates a successful import by registering the grammar in prismMock.
    importLanguageSpy = vi.spyOn(service as any, "importLanguage").mockImplementation(async (...args: unknown[]) => {
      const lang = args[0] as LanguageDefinition;
      const grammarId = lang.prismConfiguration.grammar ?? lang.value;
      if (grammarId) {
        prismMock.languages[grammarId] = {};
      }
    });
  });

  afterEach(() => {
    // restoreAllMocks resets implementations AND clears call history — no need
    // for a separate clearAllMocks call.
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  // -------------------------------------------------------------------------

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // -------------------------------------------------------------------------

  describe("loadPrismLanguage", () => {
    it("should do nothing when grammar is missing or empty", async () => {
      const lang : LanguageDefinition= {
        title: "JSON Special",
        value: "json-special",
        filterAlias: [],
        prismConfiguration: { dependencies: [], customImportPath: undefined, grammar: "json" },
        prettierConfiguration: PRETTIER_LANGUAGE_MAP["json"],
      }
      await service.loadPrismLanguage(lang);
      expect(importLanguageSpy).not.toHaveBeenCalled();
    });

    it("should do nothing when language is falsy (null)", async () => {
      await service.loadPrismLanguage(null as unknown as LanguageDefinition);
      expect(importLanguageSpy).not.toHaveBeenCalled();
    });

    it("should do nothing when the language is already registered in Prism", async () => {
      prismMock.languages["typescript"] = { tokenize: () => [] };
      await service.loadPrismLanguage(makeLanguage("typescript", [], undefined, "typescript"));
      expect(importLanguageSpy).not.toHaveBeenCalled();
    });

    it("should call importLanguage when the grammar is not yet registered", async () => {
      await service.loadPrismLanguage(makeLanguage("python-ui", [], undefined, "python"));

      expect(importLanguageSpy).toHaveBeenCalledOnce();
      expect(importLanguageSpy).toHaveBeenCalledWith(expect.objectContaining({ value: "python-ui" }));
    });

    it("should load each dependency by their grammar before loading the main language", async () => {
      const callOrder: string[] = [];

      importLanguageSpy.mockImplementation(async (...args: unknown[]) => {
        const lang = args[0] as LanguageDefinition;
        const grammar = lang.prismConfiguration.grammar;
        callOrder.push(grammar);
        prismMock.languages[grammar] = {};
      });

      // searchLanguageByValue resolves the "json-unsorted" dependency string → a full LanguageDefinition
      mockSearchLanguage.mockReturnValue(makeLanguage("json-unsorted", [], undefined, "json"));

      // Main language depends on "json-unsorted"; its grammar is "jsx"
      await service.loadPrismLanguage(makeLanguage("jsx-ui", ["json-unsorted"], undefined, "jsx"));

      expect(callOrder).toEqual(["json", "jsx"]);
    });

    it("should show an error toast using the 'value' label when importLanguage rejects", async () => {
      importLanguageSpy.mockRejectedValue(new Error("import failed"));
      vi.spyOn(console, "error").mockImplementation(() => {});

      await service.loadPrismLanguage(makeLanguage("Rust Custom", [], undefined, "rust"));

      expect(messageServiceMock.add).toHaveBeenCalledOnce();
      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "error",
          summary: "Language loading failed",
          detail: expect.stringContaining("Rust Custom"),
        })
      );
    });

    it("should skip already-loaded dependencies based on grammar check", async () => {
      // 'markup' is pre-loaded — the dependency should be skipped
      prismMock.languages["markup"] = {};
      mockSearchLanguage.mockReturnValue(makeLanguage("markup-ui", [], undefined, "markup"));

      await service.loadPrismLanguage(makeLanguage("jsx-ui", ["markup-ui"], undefined, "jsx"));

      // Only the main language (jsx) should be imported — markup is already registered
      expect(importLanguageSpy).toHaveBeenCalledOnce();
      expect(importLanguageSpy).toHaveBeenCalledWith(expect.objectContaining({ value: "jsx-ui" }));
    });
  });

  // -------------------------------------------------------------------------

  describe("importLanguage", () => {
    // The outer beforeEach mocks importLanguage, but here we want to test the
    // REAL implementation. Restore the spy so the actual method runs.
    beforeEach(() => {
      importLanguageSpy.mockRestore();
    });

    it("should use the customImportPath when one is defined", async () => {
      // Spy on the private dynamic-import helper (or equivalent) that the real
      // importLanguage delegates to, rather than re-mocking importLanguage itself.
      const dynamicImportSpy = vi
        .spyOn(service as any, "dynamicImport") // adjust to actual private helper name
        .mockResolvedValue({});

      await (service as any).importLanguage(makeLanguage("custom-lang", [], "assets/prism-custom.js"));

      expect(dynamicImportSpy).toHaveBeenCalledWith(expect.stringContaining("assets/prism-custom.js"));
    });

    it("should show an error toast and rethrow when the dynamic import fails", async () => {
      const importError = new Error("module not found");
      vi.spyOn(console, "error").mockImplementation(() => {});

      // Make the underlying dynamic import throw so the real method's catch block runs.
      vi.spyOn(service as any, "dynamicImport") // adjust to actual private helper name
        .mockRejectedValue(importError);

      await expect((service as any).importLanguage(makeLanguage("nonexistent"))).rejects.toThrow("module not found");

      expect(messageServiceMock.add).toHaveBeenCalledWith(expect.objectContaining({ severity: "error" }));
    });
  });
});
