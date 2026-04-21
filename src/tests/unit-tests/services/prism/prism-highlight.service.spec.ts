import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { MessageService } from "primeng/api";
import * as Prism from "prismjs";

import { PrismHighlightService } from "@services/prism/prism-highlight.service";
import { PrismLanguageLoaderService } from "@services/prism/prism-language-loader.service";
import { SettingsService } from "@services/settings.service";
import { LanguageDefinition } from "@types";
import { SanitizerWrapper } from "@utils/sanitizer";
import { LinesCollector } from "@utils/line-collector";

// ---------------------------------------------------------------------------
// 1. Mocks — at the absolute top level of the file
// ---------------------------------------------------------------------------

// ✅ Factory uses ONLY literals and vi.fn() — zero imported bindings
vi.mock("prismjs", () => ({
  default: {
    languages: {} as Record<string, unknown>,
    highlight: vi.fn(),
  },
  languages: {} as Record<string, unknown>,
  highlight: vi.fn(),
}));

vi.mock("@services/prism/prism-language-loader.service", () => ({
  PrismLanguageLoaderService: class {},
}));

vi.mock("@constants", () => ({
  HTML_CODE_PRE_SELECTOR: "pre",
}));

// ---------------------------------------------------------------------------
// 2. Helpers
// ---------------------------------------------------------------------------
const makeLanguage = (value = "typescript"): LanguageDefinition => ({
  title: value,
  value,
  filterAlias: [],
  prismConfiguration: { dependencies: [] },
});

// ---------------------------------------------------------------------------
// 3. Test Suite
// ---------------------------------------------------------------------------
describe("PrismHighlightService", () => {
  let service: PrismHighlightService;
  let mockPreElement: HTMLPreElement;
  let clipboardWriteMock: ReturnType<typeof vi.fn>;

  const messageServiceMock = { add: vi.fn() };
  const editorSettingsMock = {
    indentationMode: "spaces",
    indentationSize: 2,
    showLineNumbers: false,
  };
  const settingsServiceMock = {
    get editorSettings() {
      return editorSettingsMock;
    },
  };
  const prismLanguageLoaderMock = {
    loadPrismLanguage: vi.fn(),
  };

  beforeEach(() => {
    // --- DOM Setup ---
    mockPreElement = document.createElement("pre");
    mockPreElement.innerHTML = "<code>const x = 1;</code>";
    Object.defineProperty(mockPreElement, "outerText", {
      value: "const x = 1;",
      writable: true,
      configurable: true,
    });

    // --- Clipboard Setup ---
    clipboardWriteMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { write: clipboardWriteMock },
      writable: true,
      configurable: true,
    });
    vi.stubGlobal(
      "ClipboardItem",
      class ClipboardItem {
        constructor(data: Record<string, Blob>) {
          Object.assign(this, data);
        }
      }
    );

    // --- Prism mock baseline ---
    // `languages` is now a real object from our factory, safe to mutate
    Prism.languages["typescript"] = {};
    vi.mocked(Prism.highlight).mockReturnValue("");

    // --- loadPrismLanguage seeds languages into the mock ---
    prismLanguageLoaderMock.loadPrismLanguage.mockImplementation(async (lang: LanguageDefinition) => {
      Prism.languages[lang.value] = {};
    });

    // --- Method Spies ---
    vi.spyOn(SanitizerWrapper, "sanitizeInput").mockImplementation((code) => code);
    vi.spyOn(SanitizerWrapper, "sanitizeOutput").mockImplementation((html) => html);

    TestBed.configureTestingModule({
      providers: [
        PrismHighlightService,
        { provide: MessageService, useValue: messageServiceMock },
        { provide: SettingsService, useValue: settingsServiceMock },
        { provide: PrismLanguageLoaderService, useValue: prismLanguageLoaderMock },
      ],
    });

    service = TestBed.inject(PrismHighlightService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    Object.keys(Prism.languages).forEach((key) => delete Prism.languages[key]);
  });

  // ── Instantiation ──────────────────────────────────────────────────────────

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // ── highlightCode ──────────────────────────────────────────────────────────

  describe("highlightCode", () => {
    it("should sanitize the input before highlighting", async () => {
      vi.mocked(Prism.highlight).mockReturnValue("<span>highlighted</span>");

      await service.highlightCode("const x = 1;", makeLanguage());

      expect(SanitizerWrapper.sanitizeInput).toHaveBeenCalledWith("const x = 1;");
    });

    it("should call loadPrismLanguage when the language is not yet registered in Prism", async () => {
      delete Prism.languages["python"];
      vi.mocked(Prism.highlight).mockReturnValue("<span>code</span>");

      await service.highlightCode('print("hello")', makeLanguage("python"));

      expect(prismLanguageLoaderMock.loadPrismLanguage).toHaveBeenCalledWith(expect.objectContaining({ value: "python" }));
    });

    it("should NOT call loadPrismLanguage when the language is already registered", async () => {
      vi.mocked(Prism.highlight).mockReturnValue("<span>highlighted</span>");

      await service.highlightCode("const x = 1;", makeLanguage());

      expect(prismLanguageLoaderMock.loadPrismLanguage).not.toHaveBeenCalled();
    });

    it("should return the highlighted HTML string produced by Prism", async () => {
      const expectedHtml = '<span class="token keyword">const</span>';
      vi.mocked(Prism.highlight).mockReturnValue(expectedHtml);

      const result = await service.highlightCode("const x = 1;", makeLanguage());

      expect(result).toBe(expectedHtml);
    });
  });

  // ── copyToClipboard ────────────────────────────────────────────────────────

  describe("copyToClipboard", () => {
    let collectLinesSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      vi.spyOn(document, "querySelector").mockReturnValue(mockPreElement);
      collectLinesSpy = vi.spyOn(LinesCollector.prototype, "collectLinesFromNodes").mockImplementation(() => {
        /* empty */
      });
    });

    it("should display a warning toast when no <pre> element is found in the DOM", () => {
      vi.mocked(document.querySelector).mockReturnValueOnce(null);

      service.copyToClipboard();

      expect(messageServiceMock.add).toHaveBeenCalledWith(expect.objectContaining({ severity: "warn", summary: "No code available" }));
    });

    it("should write both text/html and text/plain blobs to the clipboard on success", async () => {
      service.copyToClipboard();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(clipboardWriteMock).toHaveBeenCalledOnce();
      expect(clipboardWriteMock.mock.calls[0][0][0]).toBeDefined();
    });

    it("should display a success toast after the clipboard write resolves", async () => {
      service.copyToClipboard();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(messageServiceMock.add).toHaveBeenCalledWith(expect.objectContaining({ severity: "success", summary: "Copied successfully" }));
    });

    it("should display an error toast when the clipboard write rejects", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      clipboardWriteMock.mockRejectedValueOnce(new Error("Permission denied"));

      service.copyToClipboard();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(messageServiceMock.add).toHaveBeenCalledWith(expect.objectContaining({ severity: "error", summary: "Copy failed" }));
    });

    it("should delegate DOM transformation to LinesCollector", () => {
      service.copyToClipboard();

      expect(collectLinesSpy).toHaveBeenCalledWith(mockPreElement, expect.any(HTMLPreElement));
    });
  });
});
