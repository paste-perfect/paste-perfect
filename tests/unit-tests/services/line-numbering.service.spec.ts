import { TestBed } from "@angular/core/testing";
import { LineNumberingService } from "@services/line-numbering/line-numbering.service";
import { SettingsService } from "@services/settings.service";
import { IndentationMode } from "@constants";
import { LINE_NUMBER_CLASSES } from "../../../src/app/constants/line-numbering";

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
    settingsServiceMock = {
      editorSettings: makeSettings(),
    };

    TestBed.configureTestingModule({
      providers: [
        LineNumberingService,
        { provide: SettingsService, useValue: settingsServiceMock },
      ],
    });

    service = TestBed.inject(LineNumberingService);
  });

  // ── Instantiation ────────────────────────────────────────────────────────

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // ── prependLineNumbers ───────────────────────────────────────────────────

  describe("prependLineNumbers", () => {
    // Guard-clause: feature disabled
    it("should return the original code unchanged when showLineNumbers is false", () => {
      settingsServiceMock.editorSettings = makeSettings({ showLineNumbers: false });
      const code = "const x = 1;\nconst y = 2;";
      expect(service.prependLineNumbers(code)).toBe(code);
    });

    // Guard-clause: empty / falsy values
    it("should return an empty string unchanged", () => {
      expect(service.prependLineNumbers("")).toBe("");
    });

    it("should return null as-is (falsy passthrough)", () => {
      // The implementation short-circuits on falsy code
      expect(service.prependLineNumbers(null as unknown as string)).toBeNull();
    });

    it("should return undefined as-is (falsy passthrough)", () => {
      expect(
        service.prependLineNumbers(undefined as unknown as string)
      ).toBeUndefined();
    });

    // Single-line
    it("should prepend a line-number span for a single-line code string", () => {
      const code = "const x = 1;";
      const result = service.prependLineNumbers(code);
      expect(result).toContain(`class="${LINE_NUMBER_CLASSES}"`);
      expect(result).toContain("const x = 1;");
    });

    it("should produce exactly one line when input has no newlines", () => {
      const result = service.prependLineNumbers("hello");
      expect(result.split("\n")).toHaveLength(1);
    });

    // Multi-line
    it("should prepend a line-number span on every line of multi-line code", () => {
      const code = "line one\nline two\nline three";
      const result = service.prependLineNumbers(code);
      const lines = result.split("\n");
      expect(lines).toHaveLength(3);
      lines.forEach((line) =>
        expect(line).toContain(`class="${LINE_NUMBER_CLASSES}"`)
      );
    });

    it("should preserve the original line content after the span", () => {
      const code = "hello world\nfoo bar";
      const result = service.prependLineNumbers(code);
      expect(result).toContain("hello world");
      expect(result).toContain("foo bar");
    });

    // Padding
    it("should pad single-digit line numbers when total line count reaches two digits", () => {
      const code = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join(
        "\n"
      );
      const result = service.prependLineNumbers(code);
      const resultLines = result.split("\n");
      // Line 1 is padded to width 2 → contains " 1"
      expect(resultLines[0]).toContain(" 1");
      // Line 10 needs no padding
      expect(resultLines[9]).toContain("10");
    });

    it("should not pad line numbers when there are fewer than 10 lines", () => {
      const code = Array.from({ length: 9 }, (_, i) => `line ${i + 1}`).join(
        "\n"
      );
      const result = service.prependLineNumbers(code);
      const resultLines = result.split("\n");
      // All numbers are single-digit — no leading space padding expected
      resultLines.forEach((line, i) =>
        expect(line).toContain(String(i + 1))
      );
    });

    // Edge: trailing newline
    it("should handle a string that is a single newline character", () => {
      const code = "\n";
      const result = service.prependLineNumbers(code);
      const lines = result.split("\n");
      // "\n".split("\n") === ["", ""] → 2 lines
      expect(lines).toHaveLength(2);
      lines.forEach((line) =>
        expect(line).toContain(`class="${LINE_NUMBER_CLASSES}"`)
      );
    });

    // Span structure
    it("should wrap the line number in an opening and closing span tag", () => {
      const result = service.prependLineNumbers("abc");
      expect(result).toMatch(/<span[^>]*class="[^"]*"[^>]*>/);
      expect(result).toContain("</span>");
    });

    // Line number values
    it("should use 1-based line numbering", () => {
      const code = "first\nsecond\nthird";
      const result = service.prependLineNumbers(code);
      const lines = result.split("\n");
      expect(lines[0]).toContain("1");
      expect(lines[1]).toContain("2");
      expect(lines[2]).toContain("3");
    });
  });
});
