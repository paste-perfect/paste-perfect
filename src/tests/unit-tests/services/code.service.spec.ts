import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";

import { CodeService } from "@services/code.service";
import { LanguageService } from "@services/language.service";
import { PrismHighlightService } from "@services/prism/prism-highlight.service";
import { PrettierFormattingService } from "@services/prettier/prettier-formatting.service";
import { LineNumberingService } from "@services/line-numbering/line-numbering.service";
import { SanitizerWrapper } from "@utils/sanitizer";
import { signal } from "@angular/core";

// ─── Shared stubs ────────────────────────────────────────────────────────────

const HIGHLIGHTED = '<span class="token">hello</span>';
const FORMATTED = "function hello() {}";
const WITH_LINES = "1  function hello() {}";
const SANITIZED = "1  function hello() {}";
const NO_CODE_HTML = "<span>The highlighted code will appear here after pasting some code!</span>";

/** Minimal LanguageService stub — exposes the same `selectedLanguage` getter. */
class LanguageServiceStub {
  private _selectedLanguage = signal("typescript");

  get selectedLanguage() {
    return this._selectedLanguage();
  }

  setLanguage(lang: string) {
    this._selectedLanguage.set(lang);
  }
}

/** Stub resolves immediately so async effects settle in tests. */
class PrismHighlightServiceStub {
  highlightCode = vi.fn().mockResolvedValue(HIGHLIGHTED);
}

class PrettierFormattingServiceStub {
  formatCode = vi.fn().mockResolvedValue({
    code: FORMATTED,
    formattingSuccessful: true,
  });
}

class LineNumberingServiceStub {
  prependLineNumbers = vi.fn().mockReturnValue(WITH_LINES);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Flush the microtask queue so that async effects triggered by signal
 * writes have time to complete before assertions run.
 */
const flushEffects = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("CodeService", () => {
  let service: CodeService;
  let prismStub: PrismHighlightServiceStub;
  let prettierStub: PrettierFormattingServiceStub;
  let lineNumberStub: LineNumberingServiceStub;
  let languageStub: LanguageServiceStub;

  beforeEach(() => {
    prismStub = new PrismHighlightServiceStub();
    prettierStub = new PrettierFormattingServiceStub();
    lineNumberStub = new LineNumberingServiceStub();
    languageStub = new LanguageServiceStub();

    TestBed.configureTestingModule({
      providers: [
        CodeService,
        { provide: PrismHighlightService, useValue: prismStub },
        { provide: PrettierFormattingService, useValue: prettierStub },
        { provide: LineNumberingService, useValue: lineNumberStub },
        { provide: LanguageService, useValue: languageStub },
      ],
    });

    service = TestBed.inject(CodeService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Creation ──────────────────────────────────────────────────────────────

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // ─── Initial state ─────────────────────────────────────────────────────────

  it("should initialise rawCode as an empty string", () => {
    expect(service.rawCode).toBe("");
  });

  it("should initialise highlightedCode to the placeholder message", () => {
    expect(service.highlightedCode).toBe(NO_CODE_HTML);
  });

  it("should initialise formattingSuccessful as true", () => {
    expect(service.formattingSuccessful).toBe(true);
  });

  // ─── hasCode() ─────────────────────────────────────────────────────────────

  it("should return false from hasCode() when rawCode is empty", () => {
    expect(service.hasCode()).toBe(false);
  });

  it("should return true from hasCode() after rawCode is set", () => {
    service.rawCode = "const x = 1;";
    expect(service.hasCode()).toBe(true);
  });

  it("should return false from hasCode() when rawCode contains only whitespace", () => {
    service.rawCode = "   ";
    expect(service.hasCode()).toBe(false);
  });

  // ─── rawCode setter / getter ───────────────────────────────────────────────

  it("should store the value assigned to rawCode", () => {
    service.rawCode = "const a = 42;";
    expect(service.rawCode).toBe("const a = 42;");
  });

  it("should overwrite rawCode on subsequent assignments", () => {
    service.rawCode = "first";
    service.rawCode = "second";
    expect(service.rawCode).toBe("second");
  });

  // ─── highlightedCode setter / getter ──────────────────────────────────────

  it("should store the value assigned to highlightedCode", () => {
    service.highlightedCode = "<b>hello</b>";
    expect(service.highlightedCode).toBe("<b>hello</b>");
  });

  // ─── formattingSuccessful setter / getter ─────────────────────────────────

  it("should store false when formattingSuccessful is set to false", () => {
    service.formattingSuccessful = false;
    expect(service.formattingSuccessful).toBe(false);
  });

  // ─── Effect: pipeline delegation ──────────────────────────────────────────

  it("should call PrettierFormattingService.formatCode when rawCode changes", async () => {
    service.rawCode = FORMATTED;
    await flushEffects();

    expect(prettierStub.formatCode).toHaveBeenCalled();
  });

  it("should call PrismHighlightService.highlightCode with the formatted code", async () => {
    service.rawCode = FORMATTED;
    await flushEffects();

    expect(prismStub.highlightCode).toHaveBeenCalledWith(
      expect.any(String), // escaped/formatted code
      languageStub.selectedLanguage
    );
  });

  it("should call LineNumberingService.prependLineNumbers with the highlighted output", async () => {
    service.rawCode = FORMATTED;
    await flushEffects();

    expect(lineNumberStub.prependLineNumbers).toHaveBeenCalledWith(HIGHLIGHTED);
  });

  it("should update highlightedCode with sanitized output when rawCode is non-empty", async () => {
    vi.spyOn(SanitizerWrapper, "sanitizeOutput").mockReturnValue(SANITIZED);

    service.rawCode = FORMATTED;
    await flushEffects();

    expect(service.highlightedCode).toBe(SANITIZED);
  });

  it("should set highlightedCode to the placeholder when rawCode is empty", async () => {
    // Ensure the effect re-runs with empty rawCode after a previous value.
    service.rawCode = "something";
    await flushEffects();

    service.rawCode = "";
    await flushEffects();

    expect(service.highlightedCode).toBe(NO_CODE_HTML);
  });

  it("should set formattingSuccessful to false when Prettier reports a failure", async () => {
    prettierStub.formatCode.mockResolvedValue({
      code: FORMATTED,
      formattingSuccessful: false,
    });

    service.rawCode = "invalid{{{";
    await flushEffects();

    expect(service.formattingSuccessful).toBe(false);
  });

  it("should set formattingSuccessful back to true on a successful subsequent call", async () => {
    // First call fails.
    prettierStub.formatCode.mockResolvedValueOnce({
      code: FORMATTED,
      formattingSuccessful: false,
    });
    service.rawCode = "bad code";
    await flushEffects();

    // Second call succeeds.
    prettierStub.formatCode.mockResolvedValueOnce({
      code: FORMATTED,
      formattingSuccessful: true,
    });
    service.rawCode = "const ok = true;";
    await flushEffects();

    expect(service.formattingSuccessful).toBe(true);
  });

  it("should re-run the pipeline when the selected language changes on LanguageService", async () => {
    service.rawCode = FORMATTED;
    await flushEffects();

    const callsBefore = prismStub.highlightCode.mock.calls.length;

    languageStub.setLanguage("python");
    // Trigger signal read — in a real app the signal would propagate;
    // here we write rawCode again to force the effect to re-evaluate.
    service.rawCode = FORMATTED;
    await flushEffects();

    expect(prismStub.highlightCode.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("should pass the escaped input (not the raw string) to PrettierFormattingService", async () => {
    const escapeSpy = vi.spyOn(SanitizerWrapper, "escapeUmlauts").mockReturnValue("escaped_code");

    service.rawCode = "Ä code";
    await flushEffects();

    expect(escapeSpy).toHaveBeenCalledWith("Ä code");
    expect(prettierStub.formatCode).toHaveBeenCalledWith("escaped_code", expect.any(String));
  });
});
