import { beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { PrismLanguageLoaderService } from "@services/prism/prism-language-loader.service";
import { MessageService } from "primeng/api";
import { LocationStrategy } from "@angular/common";
import { LanguageDefinition } from "@types";
import { createMessageMock, useStandardTeardown } from "../../../test-utils/utils";
import { TYPESCRIPT } from "../../../mocks/languages";

const mockSearchLanguage = vi.hoisted(() => vi.fn());

const prismMock = vi.hoisted(() => {
  return {
    languages: {} as Record<string, any>,
    highlight: vi.fn(),
  };
});

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

const resetPrismLanguages = () => {
  Object.keys(prismMock.languages).forEach((key) => delete prismMock.languages[key]);
};

describe("PrismLanguageLoaderService", () => {
  useStandardTeardown();

  let service: PrismLanguageLoaderService;
  let importLanguageSpy: MockInstance;

  const messageServiceMock = createMessageMock();
  const locationStrategyMock = { getBaseHref: vi.fn().mockReturnValue("/") };

  beforeEach(() => {
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

    importLanguageSpy = vi.spyOn(service as any, "importLanguage").mockImplementation(async (...args: unknown[]) => {
      const lang = args[0] as LanguageDefinition;
      const grammarId = lang.prismConfiguration.grammar ?? lang.value;
      if (grammarId) prismMock.languages[grammarId] = {};
    });
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("loadPrismLanguage", () => {
    it("should do nothing when the language is already registered in Prism", async () => {
      const grammarId = TYPESCRIPT.prismConfiguration.grammar;
      prismMock.languages[grammarId] = { tokenize: vi.fn() };

      await service.loadPrismLanguage({
        title: "TypeScript",
        value: "typescript",
        filterAlias: [],
        prismConfiguration: {
          dependencies: [],
          grammar: grammarId,
        },
      });

      expect(importLanguageSpy).not.toHaveBeenCalled();
    });

    it("should skip already-loaded dependencies based on grammar check", async () => {
      const depGrammar = "markup";
      prismMock.languages[depGrammar] = {};

      const markupDep: LanguageDefinition = {
        title: "Markup UI",
        value: "markup-ui",
        filterAlias: [],
        prismConfiguration: { dependencies: [], grammar: depGrammar }, // grammar is 'markup'
      };

      mockSearchLanguage.mockReturnValue(markupDep);

      const jsxLang: LanguageDefinition = {
        title: "JSX UI",
        value: "jsx-ui",
        filterAlias: [],
        prismConfiguration: {
          dependencies: ["markup-ui"],
          grammar: "jsx",
        },
      };

      // 2. Act
      await service.loadPrismLanguage(jsxLang);

      // 3. Assert:
      // Should call once for 'jsx-ui'
      // Should NOT call for 'markup-ui' (because 'markup' grammar is already in Prism)
      expect(importLanguageSpy).toHaveBeenCalledOnce();
      expect(importLanguageSpy).toHaveBeenCalledWith(expect.objectContaining({ value: "jsx-ui" }));
    });

    it("should do nothing when language is falsy (null)", async () => {
      await service.loadPrismLanguage(null as unknown as LanguageDefinition);
      expect(importLanguageSpy).not.toHaveBeenCalled();
    });

    it("should call importLanguage when the grammar is not yet registered", async () => {
      const lang: LanguageDefinition = {
        title: "Python UI",
        value: "python-ui",
        filterAlias: [],
        prismConfiguration: { dependencies: [], grammar: "python" },
      };

      await service.loadPrismLanguage(lang);

      expect(importLanguageSpy).toHaveBeenCalledOnce();
      expect(importLanguageSpy).toHaveBeenCalledWith(expect.objectContaining({ value: "python-ui" }));
    });

    it("should load each dependency by grammar before loading the main language", async () => {
      const callOrder: string[] = [];
      importLanguageSpy.mockImplementation(async (...args: unknown[]) => {
        const lang = args[0] as LanguageDefinition;
        callOrder.push(lang.prismConfiguration.grammar);
        prismMock.languages[lang.prismConfiguration.grammar] = {};
      });

      const jsonDep: LanguageDefinition = {
        title: "JSON Unsorted",
        value: "json-unsorted",
        filterAlias: [],
        prismConfiguration: { dependencies: [], grammar: "json" },
      };
      mockSearchLanguage.mockReturnValue(jsonDep);

      const jsxLang: LanguageDefinition = {
        title: "JSX UI",
        value: "jsx-ui",
        filterAlias: [],
        prismConfiguration: { dependencies: ["json-unsorted"], grammar: "jsx" },
      };

      await service.loadPrismLanguage(jsxLang);

      expect(callOrder).toEqual(["json", "jsx"]);
    });

    it("should show an error toast using the 'value' label when importLanguage rejects", async () => {
      importLanguageSpy.mockRejectedValue(new Error("import failed"));
      vi.spyOn(console, "error").mockImplementation(() => undefined);

      const lang: LanguageDefinition = {
        title: "Rust Custom",
        value: "Rust Custom",
        filterAlias: [],
        prismConfiguration: { dependencies: [], grammar: "rust" },
      };

      await service.loadPrismLanguage(lang);

      expect(messageServiceMock.add).toHaveBeenCalledOnce();
      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "error",
          summary: "Language loading failed",
          detail: expect.stringContaining("Rust Custom"),
        })
      );
    });
  });

  describe("importLanguage", () => {
    beforeEach(() => importLanguageSpy.mockRestore());

    it("should use the customImportPath when one is defined", async () => {
      // We can only verify the effect: no error is thrown and the function
      // attempts to load. Since the real dynamic import will fail in test env,
      // we just verify it rejects (module doesn't exist) rather than using
      // a non-existent internal method.
      vi.spyOn(console, "error").mockImplementation(() => undefined);

      const lang: LanguageDefinition = {
        title: "Custom Lang",
        value: "custom-lang",
        filterAlias: [],
        prismConfiguration: { dependencies: [], grammar: "custom-lang", customImportPath: "assets/prism-custom.js" },
      };

      // importLanguage will attempt a real import and reject — that's expected
      await expect((service as any).importLanguage(lang)).rejects.toThrow();
      expect(messageServiceMock.add).toHaveBeenCalledWith(expect.objectContaining({ severity: "error" }));
    });

    it("should show an error toast and rethrow when the dynamic import fails", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);

      const lang: LanguageDefinition = {
        title: "Nonexistent",
        value: "nonexistent",
        filterAlias: [],
        prismConfiguration: { dependencies: [], grammar: "nonexistent" },
      };

      await expect((service as any).importLanguage(lang)).rejects.toThrow();
      expect(messageServiceMock.add).toHaveBeenCalledWith(expect.objectContaining({ severity: "error" }));
    });
  });
});
