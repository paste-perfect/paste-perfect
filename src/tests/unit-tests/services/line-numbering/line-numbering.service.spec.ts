import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { SettingsService } from "@services/settings.service";
import { IndentationMode } from "@constants";
import { LINE_NUMBER_CLASSES } from "@constants";
import { LineNumberingService } from "@services/line-numbering/line-numbering.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type EditorSettingsOverrides = Partial<{
  showLineNumbers: boolean;
  indentationSize: number;
  indentationMode: IndentationMode;
  enableFormatting: boolean;
}>;

const makeSettings = (overrides: EditorSettingsOverrides = {}) => ({
  showLineNumbers: true,
  indentationSize: 2,
  indentationMode: IndentationMode.Spaces,
  enableFormatting: true,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("LineNumberingService", () => {
  let service: LineNumberingService;
  let settingsServiceMock: { editorSettings: ReturnType<typeof makeSettings> };

  beforeEach(() => {
    settingsServiceMock = { editorSettings: makeSettings() };

    TestBed.configureTestingModule({
      providers: [LineNumberingService, { provide: SettingsService, useValue: settingsServiceMock }],
    });

    service = TestBed.inject(LineNumberingService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  // ── Instantiation ──────────────────────────────────────────────────────────

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // ── prependLineNumbers ─────────────────────────────────────────────────────

  describe("prependLineNumbers", () => {
    describe("guard clauses", () => {
      it("should return the original code unchanged when showLineNumbers is false", () => {
        settingsServiceMock.editorSettings = makeSettings({ showLineNumbers: false });
        const code = "const x = 1;\nconst y = 2;";
        expect(service.prependLineNumbers(code)).toBe(code);
      });

      it("should return an empty string unchanged", () => {
        expect(service.prependLineNumbers("")).toBe("");
      });

      it("should return null as-is (falsy passthrough)", () => {
        expect(service.prependLineNumbers(null as unknown as string)).toBeNull();
      });

      it("should return undefined as-is (falsy passthrough)", () => {
        expect(service.prependLineNumbers(undefined as unknown as string)).toBeUndefined();
      });
    });

    describe("single-line input", () => {
      it("should prepend a line-number span for a single-line code string", () => {
        const result = service.prependLineNumbers("const x = 1;");
        expect(result).toContain(`class="${LINE_NUMBER_CLASSES}"`);
        expect(result).toContain("const x = 1;");
      });

      it("should produce exactly one line when input has no newlines", () => {
        const result = service.prependLineNumbers("hello");
        expect(result.split("\n")).toHaveLength(1);
      });
    });

    describe("multi-line input", () => {
      it("should prepend a line-number span on every line", () => {
        const code = "line one\nline two\nline three";
        const lines = service.prependLineNumbers(code).split("\n");
        expect(lines).toHaveLength(3);
        lines.forEach((line) => expect(line).toContain(`class="${LINE_NUMBER_CLASSES}"`));
      });

      it("should preserve the original line content after the span", () => {
        const result = service.prependLineNumbers("hello world\nfoo bar");
        expect(result).toContain("hello world");
        expect(result).toContain("foo bar");
      });
    });

    describe("line number padding", () => {
      it("should pad single-digit line numbers when total line count reaches two digits", () => {
        const code = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join("\n");
        const lines = service.prependLineNumbers(code).split("\n");
        expect(lines[0]).toContain(" 1"); // padded
        expect(lines[9]).toContain("10"); // no padding needed
      });

      it("should not pad line numbers when there are fewer than 10 lines", () => {
        const code = Array.from({ length: 9 }, (_, i) => `line ${i + 1}`).join("\n");
        const lines = service.prependLineNumbers(code).split("\n");
        lines.forEach((line, i) => expect(line).toContain(String(i + 1)));
      });
    });

    describe("span structure", () => {
      it("should wrap the line number in an opening and closing span tag", () => {
        const result = service.prependLineNumbers("abc");
        expect(result).toMatch(/<span[^>]*class="[^"]*"[^>]*>/);
        expect(result).toContain("</span>");
      });

      it("should use 1-based line numbering", () => {
        const lines = service.prependLineNumbers("first\nsecond\nthird").split("\n");
        expect(lines[0]).toContain("1");
        expect(lines[1]).toContain("2");
        expect(lines[2]).toContain("3");
      });
    });

    describe("edge cases", () => {
      it("should handle a string that is a single newline character", () => {
        // '\n'.split('\n') === ['', ''] → 2 spans
        const lines = service.prependLineNumbers("\n").split("\n");
        expect(lines).toHaveLength(2);
        lines.forEach((line) => expect(line).toContain(`class="${LINE_NUMBER_CLASSES}"`));
      });
    });
  });
});
