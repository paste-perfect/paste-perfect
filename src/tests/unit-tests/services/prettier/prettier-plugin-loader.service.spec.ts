import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from "vitest";
import { TestBed } from "@angular/core/testing";
import { MessageService } from "primeng/api";
import { LanguageDefinition } from "@types";
import { Plugin as PrettierPlugin } from "prettier";
import { PrettierPluginLoaderService } from "@services/prettier/prettier-plugin-loader.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeLanguage = (parser: string, plugins: string[] = []): LanguageDefinition =>
  ({ prettierConfiguration: { parser, plugins } }) as unknown as LanguageDefinition;

const makeMockPlugin = (parserName: string): PrettierPlugin =>
  ({ parsers: { [parserName]: {} }, options: {} }) as unknown as PrettierPlugin;

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("PrettierPluginLoaderService", () => {
  let service: PrettierPluginLoaderService;
  let messageServiceMock: { add: MockedFunction<MessageService["add"]> };

  beforeEach(() => {
    messageServiceMock = { add: vi.fn() };

    TestBed.configureTestingModule({
      providers: [PrettierPluginLoaderService, { provide: MessageService, useValue: messageServiceMock }],
    });

    service = TestBed.inject(PrettierPluginLoaderService);
    (service as any).pluginCache.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("getParserAndPlugins", () => {
    describe("guard clauses", () => {
      it("should return null when the language has no prettierConfiguration", async () => {
        expect(await service.getParserAndPlugins({} as LanguageDefinition)).toBeNull();
      });

      it("should return null when language is null", async () => {
        expect(await service.getParserAndPlugins(null as unknown as LanguageDefinition)).toBeNull();
      });
    });

    describe("resolved parser and plugins", () => {
      it("should return the correct parser name from the language config", async () => {
        vi.spyOn(service as any, "loadPlugin").mockResolvedValue(makeMockPlugin("babel"));
        const result = await service.getParserAndPlugins(makeLanguage("babel", ["prettier-plugin-babel"]));
        expect(result?.parser).toBe("babel");
      });

      it("should include the loaded plugin in the plugins array", async () => {
        const mockPlugin = makeMockPlugin("babel");
        vi.spyOn(service as any, "loadPlugin").mockResolvedValue(mockPlugin);
        const result = await service.getParserAndPlugins(makeLanguage("babel", ["prettier-plugin-babel"]));
        expect(result?.plugins).toContain(mockPlugin);
      });

      it("should not set pluginOptions for non-JSON parsers", async () => {
        vi.spyOn(service as any, "loadPlugin").mockResolvedValue(makeMockPlugin("babel"));
        const result = await service.getParserAndPlugins(makeLanguage("babel", ["prettier-plugin-babel"]));
        expect(result?.pluginOptions).toBeUndefined();
      });

      it("should skip a failing plugin and continue loading the remaining ones", async () => {
        const goodPlugin = makeMockPlugin("babel");
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        vi.spyOn(service as any, "loadPlugin")
          .mockRejectedValueOnce(new Error("failed"))
          .mockResolvedValueOnce(goodPlugin);

        const result = await service.getParserAndPlugins(makeLanguage("babel", ["prettier-plugin-fail", "prettier-plugin-babel"]));

        expect(result?.plugins).toContain(goodPlugin);
        expect(result?.plugins).toHaveLength(1);
      });
    });

    describe("JSON-specific behaviour", () => {
      it("should auto-inject prettier-plugin-sort-json for the json parser", async () => {
        const sortJsonPlugin = makeMockPlugin("json");
        vi.spyOn(service as any, "loadPlugin").mockResolvedValue(sortJsonPlugin);
        const result = await service.getParserAndPlugins(makeLanguage("json", []));
        expect(result?.plugins).toContain(sortJsonPlugin);
      });

      it("should set pluginOptions.jsonRecursiveSort to true for the json parser", async () => {
        vi.spyOn(service as any, "loadPlugin").mockResolvedValue(makeMockPlugin("json"));
        const result = await service.getParserAndPlugins(makeLanguage("json", []));
        expect(result?.pluginOptions).toEqual({ jsonRecursiveSort: true });
      });

      it("should not duplicate the sort-json plugin when already listed in configured plugins", async () => {
        const sortJsonPlugin = makeMockPlugin("json");
        vi.spyOn(service as any, "loadPlugin").mockResolvedValue(sortJsonPlugin);

        const result = await service.getParserAndPlugins(makeLanguage("json", ["prettier-plugin-sort-json"]));

        const occurrences = result!.plugins.filter((p) => p === sortJsonPlugin).length;
        expect(occurrences).toBe(1);
      });

      it("should return an empty plugins array when sort-json fails to load", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        vi.spyOn(service as any, "loadPlugin").mockRejectedValue(new Error("no sort-json"));

        const result = await service.getParserAndPlugins(makeLanguage("json", []));

        expect(result).not.toBeNull();
        expect(result?.plugins).toHaveLength(0);
      });
    });
  });

  describe("loadPlugin", () => {
    it("should invoke the registry factory only once across two identical loads (cache hit)", async () => {
      const mockPlugin = makeMockPlugin("sql");
      const registryFn = vi.fn().mockResolvedValue(mockPlugin);
      (service as any).pluginRegistry["prettier-plugin-sql"] = registryFn;

      const lang = makeLanguage("sql", ["prettier-plugin-sql"]);
      await service.getParserAndPlugins(lang);
      await service.getParserAndPlugins(lang);

      expect(registryFn).toHaveBeenCalledTimes(1);
    });

    it("should store the loaded plugin in the internal cache after a successful load", async () => {
      const mockPlugin = makeMockPlugin("toml");
      (service as any).pluginRegistry["prettier-plugin-toml"] = vi.fn().mockResolvedValue(mockPlugin);

      await (service as any).loadPlugin("prettier-plugin-toml");

      expect((service as any).pluginCache.get("prettier-plugin-toml")).toBe(mockPlugin);
    });

    it("should return the cached plugin without invoking the registry again", async () => {
      const cachedPlugin = makeMockPlugin("gherkin");
      (service as any).pluginCache.set("prettier-plugin-gherkin", cachedPlugin);
      const registryFn = vi.fn();
      (service as any).pluginRegistry["prettier-plugin-gherkin"] = registryFn;

      const result = await (service as any).loadPlugin("prettier-plugin-gherkin");

      expect(result).toBe(cachedPlugin);
      expect(registryFn).not.toHaveBeenCalled();
    });

    it("should display an error toast and rethrow with context when a plugin fails to load", async () => {
      const loadError = new Error("import failed");
      (service as any).pluginRegistry["prettier-plugin-java"] = vi.fn().mockRejectedValue(loadError);
      vi.spyOn(console, "error").mockImplementation(() => undefined);

      await expect((service as any).loadPlugin("prettier-plugin-java")).rejects.toThrow(
        "Failed to load Prettier plugin: prettier-plugin-java"
      );

      expect(messageServiceMock.add).toHaveBeenCalledWith(expect.objectContaining({ severity: "error", summary: "Prettier Plugin Error" }));
    });

    it("should not cache a plugin whose load failed", async () => {
      (service as any).pluginRegistry["prettier-plugin-nginx"] = vi.fn().mockRejectedValue(new Error("fail"));
      vi.spyOn(console, "error").mockImplementation(() => undefined);

      await expect((service as any).loadPlugin("prettier-plugin-nginx")).rejects.toThrow();

      expect((service as any).pluginCache.has("prettier-plugin-nginx")).toBe(false);
    });
  });
});
