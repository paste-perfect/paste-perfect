import { describe, it, expect, beforeEach, vi, type MockedFunction } from "vitest";
import { TestBed } from "@angular/core/testing";
import { MessageService } from "primeng/api";
import { LanguageDefinition } from "@types";
import { PrettierPluginLoaderService } from "@services/prettier/prettier-plugin-loader.service";
import { makeMockPlugin, useStandardTeardown } from "../../../test-utils/utils";

const makeLang = (parser: string, plugins: string[] = []): LanguageDefinition =>
  ({ prettierConfiguration: { parser, plugins } }) as unknown as LanguageDefinition;

describe("PrettierPluginLoaderService", () => {
  useStandardTeardown();

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
      beforeEach(() => {
        vi.spyOn(service as any, "loadPlugin").mockResolvedValue(makeMockPlugin("babel"));
      });

      it("should return the parser name from the language config", async () => {
        const result = await service.getParserAndPlugins(makeLang("babel", ["prettier-plugin-babel"]));
        expect(result?.parser).toBe("babel");
      });

      it("should include the loaded plugin in the plugins array", async () => {
        const mockPlugin = makeMockPlugin("babel");
        (service as any).loadPlugin.mockResolvedValue(mockPlugin);
        const result = await service.getParserAndPlugins(makeLang("babel", ["prettier-plugin-babel"]));
        expect(result?.plugins).toContain(mockPlugin);
      });

      it("should not set pluginOptions for non-JSON parsers", async () => {
        const result = await service.getParserAndPlugins(makeLang("babel", ["prettier-plugin-babel"]));
        expect(result?.pluginOptions).toBeUndefined();
      });

      it("should skip a failing plugin and continue loading the remaining ones", async () => {
        const goodPlugin = makeMockPlugin("babel");
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        (service as any).loadPlugin.mockReset().mockRejectedValueOnce(new Error("failed")).mockResolvedValueOnce(goodPlugin);

        const result = await service.getParserAndPlugins(makeLang("babel", ["prettier-plugin-fail", "prettier-plugin-babel"]));

        expect(result?.plugins).toEqual([goodPlugin]);
      });
    });

    describe("JSON-specific behaviour", () => {
      it("should auto-inject prettier-plugin-sort-json for the json parser", async () => {
        const sortJsonPlugin = makeMockPlugin("json");
        vi.spyOn(service as any, "loadPlugin").mockResolvedValue(sortJsonPlugin);

        const result = await service.getParserAndPlugins(makeLang("json", []));

        expect(result?.plugins).toContain(sortJsonPlugin);
      });

      it("should set pluginOptions.jsonRecursiveSort to true for the json parser", async () => {
        vi.spyOn(service as any, "loadPlugin").mockResolvedValue(makeMockPlugin("json"));
        const result = await service.getParserAndPlugins(makeLang("json", []));
        expect(result?.pluginOptions).toEqual({ jsonRecursiveSort: true });
      });

      it("should not duplicate the sort-json plugin when already listed", async () => {
        const sortJsonPlugin = makeMockPlugin("json");
        vi.spyOn(service as any, "loadPlugin").mockResolvedValue(sortJsonPlugin);

        const result = await service.getParserAndPlugins(makeLang("json", ["prettier-plugin-sort-json"]));

        expect(result!.plugins.filter((p) => p === sortJsonPlugin)).toHaveLength(1);
      });

      it("should return an empty plugins array when sort-json fails to load", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => undefined);
        vi.spyOn(service as any, "loadPlugin").mockRejectedValue(new Error("no sort-json"));

        const result = await service.getParserAndPlugins(makeLang("json", []));

        expect(result?.plugins).toHaveLength(0);
      });

      it("should NOT inject sort-json or set jsonRecursiveSort for json-unsorted", async () => {
        const sortJsonPlugin = makeMockPlugin("json");
        const loadPluginSpy = vi.spyOn(service as any, "loadPlugin").mockResolvedValue(sortJsonPlugin);

        const language = {
          value: "json-unsorted",
          prettierConfiguration: { parser: "json", plugins: [] },
        } as unknown as LanguageDefinition;

        const result = await service.getParserAndPlugins(language);

        expect(loadPluginSpy).not.toHaveBeenCalledWith("prettier-plugin-sort-json");
        expect(result?.plugins).toHaveLength(0);
        expect(result?.pluginOptions).toBeUndefined();
      });
    });
  });

  describe("loadPlugin", () => {
    it("should invoke the registry factory only once for repeated loads (cache hit)", async () => {
      const mockPlugin = makeMockPlugin("sql");
      const registryFn = vi.fn().mockResolvedValue(mockPlugin);
      (service as any).pluginRegistry["prettier-plugin-sql"] = registryFn;

      const lang = makeLang("sql", ["prettier-plugin-sql"]);
      await service.getParserAndPlugins(lang);
      await service.getParserAndPlugins(lang);

      expect(registryFn).toHaveBeenCalledTimes(1);
    });

    it("should store the loaded plugin in the cache after a successful load", async () => {
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
      (service as any).pluginRegistry["prettier-plugin-java"] = vi.fn().mockRejectedValue(new Error("import failed"));
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
