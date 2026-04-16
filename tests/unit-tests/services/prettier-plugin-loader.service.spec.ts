import { TestBed } from "@angular/core/testing";
import { PrettierPluginLoaderService } from "@services/prettier/prettier-plugin-loader.service";
import { MessageService } from "primeng/api";
import { LanguageDefinition } from "@types";
import { Plugin as PrettierPlugin } from "prettier";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeLanguage = (
  parser: string,
  plugins: string[] = []
): LanguageDefinition =>
  ({
    prettierConfiguration: { parser, plugins },
  } as unknown as LanguageDefinition);

/** Creates a minimal fake Prettier plugin object. */
const makeMockPlugin = (parserName: string): PrettierPlugin =>
  ({ parsers: { [parserName]: {} }, options: {} } as unknown as PrettierPlugin);

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("PrettierPluginLoaderService", () => {
  let service: PrettierPluginLoaderService;
  let messageServiceMock: jest.Mocked<Pick<MessageService, "add">>;

  beforeEach(() => {
    messageServiceMock = { add: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        PrettierPluginLoaderService,
        { provide: MessageService, useValue: messageServiceMock },
      ],
    });

    service = TestBed.inject(PrettierPluginLoaderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── Instantiation ────────────────────────────────────────────────────────

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // ── getParserAndPlugins ─────────────────────────────────────────────────

  describe("getParserAndPlugins", () => {
    it("should return null when language has no prettierConfiguration", async () => {
      const language = {} as LanguageDefinition;
      expect(await service.getParserAndPlugins(language)).toBeNull();
    });

    it("should return null when language is null", async () => {
      expect(await service.getParserAndPlugins(null as unknown as LanguageDefinition)).toBeNull();
    });

    it("should return the correct parser name", async () => {
      jest
        .spyOn(service as any, "loadPlugin")
        .mockResolvedValue(makeMockPlugin("babel"));

      const result = await service.getParserAndPlugins(
        makeLanguage("babel", ["prettier-plugin-babel"])
      );

      expect(result).not.toBeNull();
      expect(result!.parser).toBe("babel");
    });

    it("should include the loaded plugin in the plugins array", async () => {
      const mockPlugin = makeMockPlugin("babel");
      jest.spyOn(service as any, "loadPlugin").mockResolvedValue(mockPlugin);

      const result = await service.getParserAndPlugins(
        makeLanguage("babel", ["prettier-plugin-babel"])
      );

      expect(result!.plugins).toContain(mockPlugin);
    });

    it("should not set pluginOptions for non-JSON parsers", async () => {
      jest
        .spyOn(service as any, "loadPlugin")
        .mockResolvedValue(makeMockPlugin("babel"));

      const result = await service.getParserAndPlugins(
        makeLanguage("babel", ["prettier-plugin-babel"])
      );

      expect(result!.pluginOptions).toBeUndefined();
    });

    // JSON-specific behaviour
    it("should auto-inject prettier-plugin-sort-json for the json parser", async () => {
      const sortJsonPlugin = makeMockPlugin("json");
      jest.spyOn(service as any, "loadPlugin").mockResolvedValue(sortJsonPlugin);

      const result = await service.getParserAndPlugins(makeLanguage("json", []));

      expect(result!.plugins).toContain(sortJsonPlugin);
    });

    it("should set pluginOptions.jsonRecursiveSort to true for the json parser", async () => {
      jest
        .spyOn(service as any, "loadPlugin")
        .mockResolvedValue(makeMockPlugin("json"));

      const result = await service.getParserAndPlugins(makeLanguage("json", []));

      expect(result!.pluginOptions).toEqual({ jsonRecursiveSort: true });
    });

    it("should not duplicate sort-json plugin when already listed in the configured plugins", async () => {
      const sortJsonPlugin = makeMockPlugin("json");
      // Every call returns the same instance — simulates cache hit
      jest.spyOn(service as any, "loadPlugin").mockResolvedValue(sortJsonPlugin);

      const language = makeLanguage("json", ["prettier-plugin-sort-json"]);
      const result = await service.getParserAndPlugins(language);

      const occurrences = result!.plugins.filter(
        (p) => p === sortJsonPlugin
      ).length;
      expect(occurrences).toBe(1);
    });

    it("should skip a failing plugin and continue loading the rest", async () => {
      const goodPlugin = makeMockPlugin("babel");
      const consoleSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      jest
        .spyOn(service as any, "loadPlugin")
        .mockRejectedValueOnce(new Error("failed"))
        .mockResolvedValueOnce(goodPlugin);

      const language = makeLanguage("babel", [
        "prettier-plugin-fail",
        "prettier-plugin-babel",
      ]);
      const result = await service.getParserAndPlugins(language);

      expect(result!.plugins).toContain(goodPlugin);
      consoleSpy.mockRestore();
    });

    it("should return an empty plugins array when sort-json load fails for json parser", async () => {
      const consoleSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      jest
        .spyOn(service as any, "loadPlugin")
        .mockRejectedValue(new Error("no sort-json"));

      const result = await service.getParserAndPlugins(
        makeLanguage("json", [])
      );

      // Should not throw; result is still returned with an empty plugins list
      expect(result).not.toBeNull();
      expect(result!.plugins).toHaveLength(0);
      consoleSpy.mockRestore();
    });
  });

  // ── loadPlugin (via private access + cache) ───────────────────────────────

  describe("loadPlugin", () => {
    it("should return the same plugin instance on a second call (cache hit)", async () => {
      const mockPlugin = makeMockPlugin("sql");
      const registryFn = jest.fn().mockResolvedValue(mockPlugin);

      // Inject a spy factory directly into the private pluginRegistry
      (service as any).pluginRegistry["prettier-plugin-sql"] = registryFn;

      const lang = makeLanguage("sql", ["prettier-plugin-sql"]);
      await service.getParserAndPlugins(lang);
      await service.getParserAndPlugins(lang);

      // The registry factory must only be called once; second call hits the cache
      expect(registryFn).toHaveBeenCalledTimes(1);
    });

    it("should show an error toast and rethrow when a plugin fails to load", async () => {
      const loadError = new Error("import failed");
      (service as any).pluginRegistry["prettier-plugin-java"] = jest
        .fn()
        .mockRejectedValue(loadError);

      await expect(
        (service as any).loadPlugin("prettier-plugin-java")
      ).rejects.toThrow("Failed to load Prettier plugin: prettier-plugin-java");

      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "error",
          summary: "Prettier Plugin Error",
        })
      );
    });

    it("should store the loaded plugin in the cache after a successful load", async () => {
      const mockPlugin = makeMockPlugin("toml");
      (service as any).pluginRegistry["prettier-plugin-toml"] = jest
        .fn()
        .mockResolvedValue(mockPlugin);

      await (service as any).loadPlugin("prettier-plugin-toml");

      expect(
        (service as any).pluginCache.get("prettier-plugin-toml")
      ).toBe(mockPlugin);
    });

    it("should return the cached plugin without calling the registry again", async () => {
      const cachedPlugin = makeMockPlugin("gherkin");
      // Pre-populate the cache
      (service as any).pluginCache.set(
        "prettier-plugin-gherkin",
        cachedPlugin
      );
      const registryFn = jest.fn();
      (service as any).pluginRegistry["prettier-plugin-gherkin"] = registryFn;

      const result = await (service as any).loadPlugin(
        "prettier-plugin-gherkin"
      );

      expect(result).toBe(cachedPlugin);
      expect(registryFn).not.toHaveBeenCalled();
    });
  });
});
