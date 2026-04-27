import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { CodeService } from "@services/code.service";
import { LanguageService } from "@services/language.service";
import { PrismHighlightService } from "@services/prism/prism-highlight.service";
import { PrettierFormattingService } from "@services/prettier/prettier-formatting.service";
import { LineNumberingService } from "@services/line-numbering/line-numbering.service";
import { SanitizerWrapper } from "@utils/sanitizer";

const HIGHLIGHTED = '<span class="token">hello</span>';
const FORMATTED = "function hello() {}";
const WITH_LINES = "1  function hello() {}";
const SANITIZED = "1  function hello() {}";
const NO_CODE_HTML = "<span>The highlighted code will appear here after pasting some code!</span>";

const createPrismMock = () => ({ highlightCode: vi.fn().mockResolvedValue(HIGHLIGHTED) });
const createPrettierMock = () => ({
  formatCode: vi.fn().mockResolvedValue({ code: FORMATTED, formattingSuccessful: true }),
});
const createLineNumberMock = () => ({ prependLineNumbers: vi.fn().mockReturnValue(WITH_LINES) });

class LanguageServiceStub {
  private _lang = signal("typescript");
  get selectedLanguage() {
    return this._lang();
  }
  setLanguage(lang: string) {
    this._lang.set(lang);
  }
}

/** Yields to the microtask / macrotask queue so Angular effects can settle. */
const flushEffects = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("CodeService", () => {
  let service: CodeService;
  let prismMock: ReturnType<typeof createPrismMock>;
  let prettierMock: ReturnType<typeof createPrettierMock>;
  let lineNumberMock: ReturnType<typeof createLineNumberMock>;
  let languageStub: LanguageServiceStub;

  beforeEach(() => {
    prismMock = createPrismMock();
    prettierMock = createPrettierMock();
    lineNumberMock = createLineNumberMock();
    languageStub = new LanguageServiceStub();

    TestBed.configureTestingModule({
      providers: [
        CodeService,
        { provide: PrismHighlightService, useValue: prismMock },
        { provide: PrettierFormattingService, useValue: prettierMock },
        { provide: LineNumberingService, useValue: lineNumberMock },
        { provide: LanguageService, useValue: languageStub },
      ],
    });

    service = TestBed.inject(CodeService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("initial state", () => {
    it("should initialise rawCode as an empty string", () => {
      expect(service.rawCode).toBe("");
    });

    it("should initialise highlightedCode to the placeholder message", () => {
      expect(service.highlightedCode).toBe(NO_CODE_HTML);
    });

    it("should initialise formattingSuccessful as true", () => {
      expect(service.formattingSuccessful).toBe(true);
    });
  });

  describe("hasCode()", () => {
    it("should return false when rawCode is empty", () => {
      expect(service.hasCode()).toBe(false);
    });

    it("should return true after rawCode is set", () => {
      service.rawCode = "const x = 1;";
      expect(service.hasCode()).toBe(true);
    });

    it("should return false when rawCode contains only whitespace", () => {
      service.rawCode = "   ";
      expect(service.hasCode()).toBe(false);
    });
  });

  describe("rawCode setter / getter", () => {
    it("should store the assigned value", () => {
      service.rawCode = "const a = 42;";
      expect(service.rawCode).toBe("const a = 42;");
    });

    it("should overwrite rawCode on subsequent assignments", () => {
      service.rawCode = "first";
      service.rawCode = "second";
      expect(service.rawCode).toBe("second");
    });
  });

  describe("highlightedCode setter / getter", () => {
    it("should store the assigned value", () => {
      service.highlightedCode = "<b>hello</b>";
      expect(service.highlightedCode).toBe("<b>hello</b>");
    });
  });

  describe("formattingSuccessful setter / getter", () => {
    it("should store false when set to false", () => {
      service.formattingSuccessful = false;
      expect(service.formattingSuccessful).toBe(false);
    });
  });

  describe("processing pipeline (effect)", () => {
    it("should call PrettierFormattingService.formatCode when rawCode changes", async () => {
      service.rawCode = FORMATTED;
      await flushEffects();
      expect(prettierMock.formatCode).toHaveBeenCalled();
    });

    it("should call PrismHighlightService.highlightCode with the formatted code", async () => {
      service.rawCode = FORMATTED;
      await flushEffects();
      expect(prismMock.highlightCode).toHaveBeenCalledWith(expect.any(String), languageStub.selectedLanguage);
    });

    it("should call LineNumberingService.prependLineNumbers with the highlighted output", async () => {
      service.rawCode = FORMATTED;
      await flushEffects();
      expect(lineNumberMock.prependLineNumbers).toHaveBeenCalledWith(HIGHLIGHTED);
    });

    it("should update highlightedCode with sanitized output when rawCode is non-empty", async () => {
      vi.spyOn(SanitizerWrapper, "sanitizeOutput").mockReturnValue(SANITIZED);
      service.rawCode = FORMATTED;
      await flushEffects();
      expect(service.highlightedCode).toBe(SANITIZED);
    });

    it("should set highlightedCode to the placeholder when rawCode is cleared", async () => {
      service.rawCode = "something";
      await flushEffects();

      service.rawCode = "";
      await flushEffects();

      expect(service.highlightedCode).toBe(NO_CODE_HTML);
    });

    it("should set formattingSuccessful to false when Prettier reports a failure", async () => {
      prettierMock.formatCode.mockResolvedValue({ code: FORMATTED, formattingSuccessful: false });
      service.rawCode = "invalid{{{";
      await flushEffects();
      expect(service.formattingSuccessful).toBe(false);
    });

    it("should set formattingSuccessful back to true on a successful subsequent call", async () => {
      prettierMock.formatCode.mockResolvedValueOnce({ code: FORMATTED, formattingSuccessful: false });
      service.rawCode = "bad code";
      await flushEffects();

      prettierMock.formatCode.mockResolvedValueOnce({ code: FORMATTED, formattingSuccessful: true });
      service.rawCode = "const ok = true;";
      await flushEffects();

      expect(service.formattingSuccessful).toBe(true);
    });

    it("should re-run the pipeline when the selected language changes", async () => {
      service.rawCode = FORMATTED;
      await flushEffects();
      const callsBefore = prismMock.highlightCode.mock.calls.length;

      languageStub.setLanguage("python");
      service.rawCode = FORMATTED;
      await flushEffects();

      expect(prismMock.highlightCode.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it("should pass the escaped input to PrettierFormattingService", async () => {
      const escapeSpy = vi.spyOn(SanitizerWrapper, "escapeUmlauts").mockReturnValue("escaped_code");
      service.rawCode = "Ä code";
      await flushEffects();

      expect(escapeSpy).toHaveBeenCalledWith("Ä code");
      expect(prettierMock.formatCode).toHaveBeenCalledWith("escaped_code", expect.any(String));
    });
  });
});
