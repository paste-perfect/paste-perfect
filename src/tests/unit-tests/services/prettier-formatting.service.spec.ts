import { TestBed } from "@angular/core/testing";
import { PrettierFormattingService } from "@services/prettier/prettier-formatting.service";
import { PrettierPluginLoaderService } from "@services/prettier/prettier-plugin-loader.service";
import { SettingsService } from "@services/settings.service";
import { IndentationMode } from "@constants";
import { LanguageDefinition } from "@types";
import * as prettier from "prettier/standalone";
import { Plugin as PrettierPlugin } from "prettier";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock prettier/standalone globally
// ---------------------------------------------------------------------------

vi.mock("prettier/standalone", () => ({
  format: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SettingsOverrides = Partial<{
  enableFormatting: boolean;
  indentationSize: number;
  indentationMode: IndentationMode;
  showLineNumbers: boolean;
}>;

const makeSettings = (overrides: SettingsOverrides = {}) => ({
  enableFormatting: true,
  indentationSize: 2,
  indentationMode: IndentationMode.Spaces,
  showLineNumbers: false,
  ...overrides,
});

const makeLanguage = (parser = "babel"): LanguageDefinition =>
  ({
    prettierConfiguration: { parser, plugins: [] },
  }) as unknown as LanguageDefinition;

const makePluginResult = (parser: string, pluginOptions?: Record<string, unknown>) => ({
  parser,
  plugins: [] as unknown as PrettierPlugin[],
  pluginOptions,
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("PrettierFormattingService", () => {
  let service: PrettierFormattingService;
  let pluginLoaderMock: {
    getParserAndPlugins: ReturnType<typeof vi.fn>;
  };
  let settingsServiceMock: { editorSettings: ReturnType<typeof makeSettings> };

  beforeEach(() => {
    pluginLoaderMock = { getParserAndPlugins: vi.fn() };
    settingsServiceMock = { editorSettings: makeSettings() };

    TestBed.configureTestingModule({
      providers: [
        PrettierFormattingService,
        { provide: PrettierPluginLoaderService, useValue: pluginLoaderMock },
        { provide: SettingsService, useValue: settingsServiceMock },
      ],
    });

    service = TestBed.inject(PrettierFormattingService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Instantiation ────────────────────────────────────────────────────────

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // ── formatCode — early exits ──────────────────────────────────────────────

  describe("formatCode — early exits", () => {
    it("should return original code unchanged when formatting is disabled", async () => {
      settingsServiceMock.editorSettings = makeSettings({
        enableFormatting: false,
      });
      const result = await service.formatCode("const x = 1", makeLanguage());
      expect(result).toEqual({ code: "const x = 1", formattingSuccessful: true });
      expect(pluginLoaderMock.getParserAndPlugins).not.toHaveBeenCalled();
    });

    it("should return empty string unchanged when code is an empty string", async () => {
      const result = await service.formatCode("", makeLanguage());
      expect(result).toEqual({ code: "", formattingSuccessful: true });
      expect(pluginLoaderMock.getParserAndPlugins).not.toHaveBeenCalled();
    });

    it("should return whitespace-only code unchanged (trim guard)", async () => {
      const result = await service.formatCode("   ", makeLanguage());
      expect(result).toEqual({ code: "   ", formattingSuccessful: true });
      expect(pluginLoaderMock.getParserAndPlugins).not.toHaveBeenCalled();
    });

    it("should return original code when plugin loader returns null", async () => {
      pluginLoaderMock.getParserAndPlugins.mockResolvedValue(null);
      const result = await service.formatCode("const x = 1;", makeLanguage());
      expect(result).toEqual({ code: "const x = 1;", formattingSuccessful: true });
    });
  });

  // ── formatCode — successful formatting ────────────────────────────────────

  describe("formatCode — successful formatting", () => {
    beforeEach(() => {
      pluginLoaderMock.getParserAndPlugins.mockResolvedValue(makePluginResult("babel"));
      vi.mocked(prettier.format).mockResolvedValue("const x = 1;\n");
    });

    it("should call prettier.format with the resolved parser and plugins", async () => {
      const mockPlugin = { parsers: {}, options: {} } as unknown as PrettierPlugin;
      pluginLoaderMock.getParserAndPlugins.mockResolvedValue({
        parser: "babel",
        plugins: [mockPlugin],
      });

      await service.formatCode("const x=1", makeLanguage());

      expect(prettier.format).toHaveBeenCalledWith("const x=1", expect.objectContaining({ parser: "babel", plugins: [mockPlugin] }));
    });

    it("should return formatted code and formattingSuccessful: true on success", async () => {
      const result = await service.formatCode("const x=1", makeLanguage());
      expect(result).toEqual({
        code: "const x = 1;\n",
        formattingSuccessful: true,
      });
    });

    it("should pass tabWidth from settings to prettier", async () => {
      settingsServiceMock.editorSettings = makeSettings({ indentationSize: 4 });
      await service.formatCode("code", makeLanguage());
      expect(prettier.format).toHaveBeenCalledWith("code", expect.objectContaining({ tabWidth: 4 }));
    });

    it("should pass useTabs: true when indentation mode is Tabs", async () => {
      settingsServiceMock.editorSettings = makeSettings({
        indentationMode: IndentationMode.Tabs,
      });
      await service.formatCode("code", makeLanguage());
      expect(prettier.format).toHaveBeenCalledWith("code", expect.objectContaining({ useTabs: true }));
    });

    it("should pass useTabs: false when indentation mode is Spaces", async () => {
      settingsServiceMock.editorSettings = makeSettings({
        indentationMode: IndentationMode.Spaces,
      });
      await service.formatCode("code", makeLanguage());
      expect(prettier.format).toHaveBeenCalledWith("code", expect.objectContaining({ useTabs: false }));
    });

    it("should spread pluginOptions into the prettier.format call", async () => {
      pluginLoaderMock.getParserAndPlugins.mockResolvedValue(makePluginResult("json", { jsonRecursiveSort: true }));
      vi.mocked(prettier.format).mockResolvedValue("{}");

      await service.formatCode("{}", makeLanguage("json"));

      expect(prettier.format).toHaveBeenCalledWith("{}", expect.objectContaining({ jsonRecursiveSort: true }));
    });
  });

  // ── formatCode — JSON key sorting ──────────────────────────────────────────

  describe("formatCode — JSON key sorting", () => {
    it("should include jsonRecursiveSort: true when formatting JSON", async () => {
      pluginLoaderMock.getParserAndPlugins.mockResolvedValue(makePluginResult("json", { jsonRecursiveSort: true }));
      vi.mocked(prettier.format).mockResolvedValue('{\n  "a": 1,\n  "z": 2\n}\n');

      const result = await service.formatCode('{"z":2,"a":1}', makeLanguage("json"));

      expect(prettier.format).toHaveBeenCalledWith('{"z":2,"a":1}', expect.objectContaining({ jsonRecursiveSort: true, parser: "json" }));
      expect(result.formattingSuccessful).toBe(true);
    });
  });

  // ── formatCode — failure handling ───────────────────────────────────────────

  describe("formatCode — failure handling", () => {
    it("should return original code with formattingSuccessful: false when prettier throws", async () => {
      pluginLoaderMock.getParserAndPlugins.mockResolvedValue(makePluginResult("babel"));
      vi.mocked(prettier.format).mockRejectedValue(new Error("syntax error"));

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        /* empty */
      });
      const result = await service.formatCode("const x =", makeLanguage());

      expect(result).toEqual({
        code: "const x =",
        formattingSuccessful: false,
      });
      consoleSpy.mockRestore();
    });

    it("should not throw when prettier format rejects", async () => {
      pluginLoaderMock.getParserAndPlugins.mockResolvedValue(makePluginResult("babel"));
      vi.mocked(prettier.format).mockRejectedValue(new Error("oops"));
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        /* empty */
      });

      await expect(service.formatCode("broken code", makeLanguage())).resolves.not.toThrow();
      consoleSpy.mockRestore();
    });
  });
});
