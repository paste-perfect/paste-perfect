import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { MessageService } from "primeng/api";
import { PrismHighlightService } from "@services/prism/prism-highlight.service";
import { PrismLanguageLoaderService } from "@services/prism/prism-language-loader.service";
import { SettingsService } from "@services/settings.service";
import { SanitizerWrapper } from "@utils/sanitizer";
import { LinesCollector } from "@utils/line-collector";
import { makeLanguage, makeEditorSettings, createMockPreElement, createMessageMock } from "../../test-utils";

const prismMock = vi.hoisted(() => ({
  languages: {} as Record<string, unknown>,
  highlight: vi.fn(),
}));

vi.mock("prismjs", () => ({
  default: prismMock,
  get languages() {
    return prismMock.languages;
  },
  get highlight() {
    return prismMock.highlight;
  },
}));

vi.mock("@services/prism/prism-language-loader.service", () => ({
  PrismLanguageLoaderService: class {},
}));

vi.mock("@constants", () => ({
  HTML_CODE_PRE_SELECTOR: "pre",
}));

/** Drains the microtask / macrotask queue so async fire-and-forget work settles. */
const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("PrismHighlightService", () => {
  let service: PrismHighlightService;
  let clipboardWriteMock: ReturnType<typeof vi.fn>;
  let prismLanguageLoaderMock: { loadPrismLanguage: ReturnType<typeof vi.fn> };

  const messageServiceMock = createMessageMock();
  const settingsServiceMock = {
    get editorSettings() {
      return makeEditorSettings({ showLineNumbers: false });
    },
  };

  beforeEach(() => {
    Object.keys(prismMock.languages).forEach((key) => delete prismMock.languages[key]);
    prismMock.languages["typescript"] = {};
    prismMock.highlight.mockReturnValue("");

    prismLanguageLoaderMock = { loadPrismLanguage: vi.fn() };
    prismLanguageLoaderMock.loadPrismLanguage.mockImplementation(async (lang) => {
      prismMock.languages[lang.value] = {};
    });

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
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("highlightCode", () => {
    it("should sanitize the input before highlighting", async () => {
      prismMock.highlight.mockReturnValue("<span>highlighted</span>");

      await service.highlightCode("const x = 1;", makeLanguage());

      expect(SanitizerWrapper.sanitizeInput).toHaveBeenCalledWith("const x = 1;");
    });

    it("should call loadPrismLanguage when the language is not yet registered in Prism", async () => {
      delete prismMock.languages["python"];
      prismMock.highlight.mockReturnValue("<span>code</span>");

      await service.highlightCode('print("hello")', makeLanguage("python"));

      expect(prismLanguageLoaderMock.loadPrismLanguage).toHaveBeenCalledWith(expect.objectContaining({ value: "python" }));
    });

    it("should NOT call loadPrismLanguage when the language is already registered", async () => {
      prismMock.highlight.mockReturnValue("<span>highlighted</span>");

      await service.highlightCode("const x = 1;", makeLanguage());

      expect(prismLanguageLoaderMock.loadPrismLanguage).not.toHaveBeenCalled();
    });

    it("should return the highlighted HTML string produced by Prism", async () => {
      const expectedHtml = '<span class="token keyword">const</span>';
      prismMock.highlight.mockReturnValue(expectedHtml);

      const result = await service.highlightCode("const x = 1;", makeLanguage());

      expect(result).toBe(expectedHtml);
    });
  });

  describe("copyToClipboard", () => {
    let mockPreElement: HTMLPreElement;
    let collectLinesSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mockPreElement = createMockPreElement();
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
      await flushPromises();

      expect(clipboardWriteMock).toHaveBeenCalledOnce();
      expect(clipboardWriteMock.mock.calls[0][0][0]).toBeDefined();
    });

    it("should display a success toast after the clipboard write resolves", async () => {
      service.copyToClipboard();
      await flushPromises();

      expect(messageServiceMock.add).toHaveBeenCalledWith(expect.objectContaining({ severity: "success", summary: "Copied successfully" }));
    });

    it("should display an error toast when the clipboard write rejects", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      clipboardWriteMock.mockRejectedValueOnce(new Error("Permission denied"));

      service.copyToClipboard();
      await flushPromises();

      expect(messageServiceMock.add).toHaveBeenCalledWith(expect.objectContaining({ severity: "error", summary: "Copy failed" }));
    });

    it("should delegate DOM transformation to LinesCollector", () => {
      service.copyToClipboard();

      expect(collectLinesSpy).toHaveBeenCalledWith(mockPreElement, expect.any(HTMLPreElement));
    });
  });
});
