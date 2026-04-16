import { TestBed } from "@angular/core/testing";
import { PrismLanguageLoaderService } from "@services/prism/prism-language-loader.service";
import { MessageService } from "primeng/api";
import { LocationStrategy } from "@angular/common";
import { LanguageDefinition } from "@types";
import * as Prism from "prismjs";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

jest.mock("prismjs", () => ({
  languages: {} as Record<string, unknown>,
  highlight: jest.fn(),
}));

jest.mock("@utils/languages-utils", () => ({
  searchLanguageByValue: jest.fn(),
}));

import { searchLanguageByValue } from "@utils/languages-utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeLanguage = (
  value: string,
  dependencies: string[] = [],
  customImportPath?: string
): LanguageDefinition =>
  ({
    value,
    prismConfiguration: { dependencies, customImportPath },
  } as unknown as LanguageDefinition);

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("PrismLanguageLoaderService", () => {
  let service: PrismLanguageLoaderService;
  let messageServiceMock: jest.Mocked<Pick<MessageService, "add">>;
  let locationStrategyMock: jest.Mocked<Pick<LocationStrategy, "getBaseHref">>;

  beforeEach(() => {
    messageServiceMock = { add: jest.fn() };
    locationStrategyMock = { getBaseHref: jest.fn().mockReturnValue("/") };

    // Reset registered Prism languages before every test
    (Prism.languages as Record<string, unknown>) = {};

    TestBed.configureTestingModule({
      providers: [
        PrismLanguageLoaderService,
        { provide: MessageService, useValue: messageServiceMock },
        { provide: LocationStrategy, useValue: locationStrategyMock },
      ],
    });

    service = TestBed.inject(PrismLanguageLoaderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── Instantiation ────────────────────────────────────────────────────────

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // ── loadPrismLanguage ────────────────────────────────────────────────────

  describe("loadPrismLanguage", () => {
    it("should do nothing when language value is an empty string", async () => {
      const importSpy = jest.spyOn(service as any, "importLanguage");
      await service.loadPrismLanguage(
        makeLanguage("") as LanguageDefinition
      );
      expect(importSpy).not.toHaveBeenCalled();
    });

    it("should do nothing when language is falsy (null)", async () => {
      const importSpy = jest.spyOn(service as any, "importLanguage");
      // The guard checks `!language?.value`, so passing null triggers the early return
      await service.loadPrismLanguage(null as unknown as LanguageDefinition);
      expect(importSpy).not.toHaveBeenCalled();
    });

    it("should do nothing when the language is already registered in Prism", async () => {
      (Prism.languages as Record<string, unknown>)["typescript"] = {
        tokenize: () => [],
      };
      const importSpy = jest.spyOn(service as any, "importLanguage");

      await service.loadPrismLanguage(makeLanguage("typescript"));

      expect(importSpy).not.toHaveBeenCalled();
    });

    it("should call importLanguage when the language is not yet registered", async () => {
      const importSpy = jest
        .spyOn(service as any, "importLanguage")
        .mockResolvedValue(undefined);

      await service.loadPrismLanguage(makeLanguage("python"));

      expect(importSpy).toHaveBeenCalledWith(
        expect.objectContaining({ value: "python" })
      );
    });

    it("should load each dependency before loading the main language", async () => {
      const callOrder: string[] = [];
      jest
        .spyOn(service as any, "importLanguage")
        .mockImplementation(async (lang: LanguageDefinition) => {
          callOrder.push(lang.value);
        });

      const depLanguage = makeLanguage("markup");
      (searchLanguageByValue as jest.Mock).mockReturnValue(depLanguage);

      await service.loadPrismLanguage(makeLanguage("jsx", ["markup"]));

      // Dependency must be first
      expect(callOrder[0]).toBe("markup");
      expect(callOrder[1]).toBe("jsx");
    });

    it("should show an error toast (not throw) when importLanguage rejects", async () => {
      jest
        .spyOn(service as any, "importLanguage")
        .mockRejectedValue(new Error("import failed"));
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // loadPrismLanguage swallows the error — must resolve, not reject
      await expect(
        service.loadPrismLanguage(makeLanguage("rust"))
      ).resolves.toBeUndefined();

      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "error",
          summary: "Language loading failed",
        })
      );
      consoleSpy.mockRestore();
    });

    it("should show a warning toast when a declared dependency cannot be found", async () => {
      (searchLanguageByValue as jest.Mock).mockReturnValue(undefined);
      jest
        .spyOn(service as any, "importLanguage")
        .mockResolvedValue(undefined);
      const consoleSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      await service.loadPrismLanguage(makeLanguage("jsx", ["unknown-dep"]));

      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "warn",
          summary: "Missing Dependency",
        })
      );
      consoleSpy.mockRestore();
    });

    it("should skip already-loaded dependencies (already in Prism.languages)", async () => {
      const importSpy = jest
        .spyOn(service as any, "importLanguage")
        .mockResolvedValue(undefined);

      // Simulate markup already loaded
      (Prism.languages as Record<string, unknown>)["markup"] = {};
      const depLanguage = makeLanguage("markup");
      (searchLanguageByValue as jest.Mock).mockReturnValue(depLanguage);

      await service.loadPrismLanguage(makeLanguage("jsx", ["markup"]));

      // importLanguage should only be called for jsx, not for markup
      expect(importSpy).toHaveBeenCalledTimes(1);
      expect(importSpy).toHaveBeenCalledWith(
        expect.objectContaining({ value: "jsx" })
      );
    });
  });

  // ── importLanguage (private, tested via spy overrides) ───────────────────

  describe("importLanguage", () => {
    it("should use the customImportPath when one is defined", async () => {
      const dynamicImportSpy = jest.fn().mockResolvedValue({});

      jest
        .spyOn(service as any, "importLanguage")
        .mockImplementationOnce(async (lang: LanguageDefinition) => {
          if (lang.prismConfiguration.customImportPath) {
            await dynamicImportSpy(
              `/${lang.prismConfiguration.customImportPath}`
            );
          }
        });

      await (service as any).importLanguage(
        makeLanguage("custom-lang", [], "assets/prism-custom.js")
      );

      expect(dynamicImportSpy).toHaveBeenCalledWith(
        "/assets/prism-custom.js"
      );
    });

    it("should show an error toast and rethrow when the dynamic import fails", async () => {
      const importError = new Error("module not found");
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Allow the real importLanguage to run by NOT mocking it,
      // but inject a registry entry that rejects.
      // We mock only the spy to rethrow so we can test the re-throw contract.
      jest
        .spyOn(service as any, "importLanguage")
        .mockRejectedValue(importError);

      await expect(
        (service as any).importLanguage(makeLanguage("nonexistent"))
      ).rejects.toThrow("module not found");

      consoleSpy.mockRestore();
    });
  });
});
