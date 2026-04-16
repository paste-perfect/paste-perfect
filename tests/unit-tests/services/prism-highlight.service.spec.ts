import { TestBed } from "@angular/core/testing";
import { PrismHighlightService } from "@services/prism/prism-highlight.service";
import { PrismLanguageLoaderService } from "@services/prism/prism-language-loader.service";
import { SettingsService } from "@services/settings.service";
import { MessageService } from "primeng/api";
import { LanguageDefinition } from "@types";
import { IndentationMode } from "@constants";
import * as Prism from "prismjs";
import { SanitizerWrapper } from "@utils/sanitizer";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

jest.mock("prismjs", () => ({
  languages: { javascript: {} } as Record<string, unknown>,
  highlight: jest.fn(
    (code: string) => `<highlighted>${code}</highlighted>`
  ),
}));

jest.mock("@utils/sanitizer", () => ({
  SanitizerWrapper: {
    sanitizeInput: jest.fn((code: string) => code),
    sanitizeOutput: jest.fn((html: string) => html),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeLanguage = (value = "javascript"): LanguageDefinition =>
  ({ value } as unknown as LanguageDefinition);

const makeSettings = () => ({
  indentationMode: IndentationMode.Spaces,
  indentationSize: 2,
  showLineNumbers: false,
  enableFormatting: true,
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("PrismHighlightService", () => {
  let service: PrismHighlightService;
  let prismLanguageLoaderMock: jest.Mocked<
    Pick<PrismLanguageLoaderService, "loadPrismLanguage">
  >;
  let settingsServiceMock: { editorSettings: ReturnType<typeof makeSettings> };
  let messageServiceMock: jest.Mocked<Pick<MessageService, "add">>;

  beforeEach(() => {
    prismLanguageLoaderMock = {
      loadPrismLanguage: jest.fn().mockResolvedValue(undefined),
    };
    settingsServiceMock = { editorSettings: makeSettings() };
    messageServiceMock = { add: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        PrismHighlightService,
        {
          provide: PrismLanguageLoaderService,
          useValue: prismLanguageLoaderMock,
        },
        { provide: SettingsService, useValue: settingsServiceMock },
        { provide: MessageService, useValue: messageServiceMock },
      ],
    });

    service = TestBed.inject(PrismHighlightService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── Instantiation ────────────────────────────────────────────────────────

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  // ── highlightCode ───────────────────────────────────────────────────────

  describe("highlightCode", () => {
    it("should sanitize the input code before highlighting", async () => {
      await service.highlightCode("const x = 1;", makeLanguage("javascript"));
      expect(SanitizerWrapper.sanitizeInput).toHaveBeenCalledWith(
        "const x = 1;"
      );
    });

    it("should NOT call loadPrismLanguage when the language is already in Prism.languages", async () => {
      // "javascript" is pre-seeded in the Prism mock
      await service.highlightCode("const x = 1;", makeLanguage("javascript"));
      expect(prismLanguageLoaderMock.loadPrismLanguage).not.toHaveBeenCalled();
    });

    it("should call loadPrismLanguage when the language is not yet in Prism.languages", async () => {
      // Remove python so the guard triggers
      (Prism.languages as Record<string, unknown>)["python"] = undefined;

      const language = makeLanguage("python");
      await service.highlightCode("print('hello')", language);

      expect(prismLanguageLoaderMock.loadPrismLanguage).toHaveBeenCalledWith(
        language
      );
    });

    it("should call Prism.highlight with code, grammar, and language value", async () => {
      const language = makeLanguage("javascript");
      await service.highlightCode("const x = 1;", language);

      expect(Prism.highlight).toHaveBeenCalledWith(
        "const x = 1;",
        Prism.languages["javascript"],
        "javascript"
      );
    });

    it("should return the highlighted HTML string produced by Prism", async () => {
      const result = await service.highlightCode(
        "const x = 1;",
        makeLanguage("javascript")
      );
      expect(result).toBe("<highlighted>const x = 1;</highlighted>");
    });

    it("should pass the sanitized (not the raw) code to Prism.highlight", async () => {
      // Make sanitizeInput return a modified version
      (SanitizerWrapper.sanitizeInput as jest.Mock).mockReturnValueOnce(
        "SANITIZED"
      );

      await service.highlightCode("raw code", makeLanguage("javascript"));

      expect(Prism.highlight).toHaveBeenCalledWith(
        "SANITIZED",
        expect.anything(),
        "javascript"
      );
    });
  });

  // ── copyToClipboard ───────────────────────────────────────────────────

  describe("copyToClipboard", () => {
    afterEach(() => {
      // Clean DOM between tests
      document.body.innerHTML = "";
    });

    it("should show a warn toast when no <pre> element exists in the DOM", () => {
      document.body.innerHTML = "";
      service.copyToClipboard();
      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "warn",
          summary: "No code available",
        })
      );
    });

    it("should NOT show a warn toast when a <pre> element exists", () => {
      document.body.innerHTML = `<pre><code class="code-highlight">const x = 1;</code></pre>`;

      Object.defineProperty(navigator, "clipboard", {
        value: { write: jest.fn().mockResolvedValue(undefined) },
        writable: true,
        configurable: true,
      });

      service.copyToClipboard();

      expect(messageServiceMock.add).not.toHaveBeenCalledWith(
        expect.objectContaining({ severity: "warn" })
      );
    });

    it("should attempt to write to the clipboard when a <pre> element is present", async () => {
      document.body.innerHTML = `<pre><code class="code-highlight">const x = 1;</code></pre>`;

      const mockWrite = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { write: mockWrite },
        writable: true,
        configurable: true,
      });

      service.copyToClipboard();

      // Flush the promise chain
      await Promise.resolve();

      expect(mockWrite).toHaveBeenCalled();
    });

    it("should show a success toast after a successful clipboard write", async () => {
      document.body.innerHTML = `<pre><code class="code-highlight">hello</code></pre>`;

      Object.defineProperty(navigator, "clipboard", {
        value: { write: jest.fn().mockResolvedValue(undefined) },
        writable: true,
        configurable: true,
      });

      service.copyToClipboard();
      // Let all microtasks settle
      await new Promise((r) => setTimeout(r, 0));

      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "success",
          summary: "Copied successfully",
        })
      );
    });

    it("should show an error toast when the clipboard write rejects", async () => {
      document.body.innerHTML = `<pre><code class="code-highlight">hello</code></pre>`;

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      Object.defineProperty(navigator, "clipboard", {
        value: {
          write: jest.fn().mockRejectedValue(new Error("permission denied")),
        },
        writable: true,
        configurable: true,
      });

      service.copyToClipboard();
      await new Promise((r) => setTimeout(r, 0));

      expect(messageServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "error",
          summary: "Copy failed",
        })
      );
      consoleSpy.mockRestore();
    });

    it("should sanitize the output HTML before writing to the clipboard", async () => {
      document.body.innerHTML = `<pre><code class="code-highlight">hello</code></pre>`;

      Object.defineProperty(navigator, "clipboard", {
        value: { write: jest.fn().mockResolvedValue(undefined) },
        writable: true,
        configurable: true,
      });

      service.copyToClipboard();
      await new Promise((r) => setTimeout(r, 0));

      expect(SanitizerWrapper.sanitizeOutput).toHaveBeenCalled();
    });
  });
});
