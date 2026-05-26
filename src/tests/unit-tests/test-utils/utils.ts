import type { Plugin as PrettierPlugin } from "prettier";
import { afterEach, vi } from "vitest";
import { InlineStyleApplier } from "@utils/inline-style-applier";
import { IndentationMode } from "@constants/const";
import { CopyMode, CopySettings, DEFAULT_COPY_SETTINGS } from "@types";
import { TestBed } from "@angular/core/testing";

// ---------------------------------------------------------------------------
// Language & Settings Factories
// ---------------------------------------------------------------------------

type EditorSettingsOverrides = Partial<{
  showLineNumbers: boolean;
  indentationSize: number;
  indentationMode: IndentationMode;
  enableFormatting: boolean;
}>;

export const makeEditorSettings = (overrides: EditorSettingsOverrides = {}) => ({
  showLineNumbers: true,
  indentationSize: 2,
  indentationMode: IndentationMode.Spaces,
  enableFormatting: true,
  ...overrides,
});

type CopySettingsOverrides = Partial<CopySettings>;

export const makeCopySettings = (overrides: CopySettingsOverrides = {}): CopySettings => ({
  ...DEFAULT_COPY_SETTINGS,
  ...overrides,
});

/** Re-exports CopyMode for convenience in test files. */
export { CopyMode };

export const makeMockPlugin = (parserName: string): PrettierPlugin =>
  ({ parsers: { [parserName]: {} }, options: {} }) as unknown as PrettierPlugin;

export const flushPromises = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

// ---------------------------------------------------------------------------
// DOM Factories
// ---------------------------------------------------------------------------

export const createTextNode = (text: string): Text => document.createTextNode(text);

export const createStyledSpan = (text: string, style: Partial<CSSStyleDeclaration> = {}): HTMLSpanElement => {
  const span = document.createElement("span");
  Object.assign(span.style, style);
  span.appendChild(document.createTextNode(text));
  return span;
};

/** Creates a <pre> element whose `outerText` is configurable (Happy DOM compat). */
export const createMockPreElement = (innerHtml = "<code>const x = 1;</code>", outerText = "const x = 1;"): HTMLPreElement => {
  const el = document.createElement("pre");
  el.innerHTML = innerHtml;
  Object.defineProperty(el, "outerText", { value: outerText, writable: true, configurable: true });
  return el;
};

/** Creates two sibling DIVs (`original` + `cloned`) attached to <body>. */
export const createOriginalClonedPair = (): { original: HTMLElement; cloned: HTMLElement } => {
  const original = document.createElement("div");
  original.id = "original-test-container";
  const cloned = document.createElement("div");
  cloned.id = "cloned-test-container";
  document.body.appendChild(original);
  document.body.appendChild(cloned);
  return { original, cloned };
};

/** Mocks `document.getElementsByClassName('line-number-gutter')` to return a 50px-wide stub element. */
export const mockLineNumberGutter = (width = 50): HTMLElement => {
  const el = document.createElement("span");
  el.className = "line-number-gutter";
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    width,
    left: 0,
    right: width,
    top: 0,
    bottom: 20,
    height: 20,
    x: 0,
    y: 0,
    toJSON: () => undefined,
  } as DOMRect);
  vi.spyOn(document, "getElementsByClassName").mockImplementation(
    (className) => (className === "line-number-gutter" ? [el] : []) as unknown as HTMLCollectionOf<Element>
  );
  return el;
};

// ---------------------------------------------------------------------------
// Shared Mock Factories
// ---------------------------------------------------------------------------

/** Minimal StorageService stub. Pass `stored` to prime the getItem return value. */
export const createStorageMock = (stored: unknown = null) => ({
  getItem: vi.fn().mockReturnValue(stored),
  setItem: vi.fn(),
});

/** Minimal MessageService stub (PrimeNG). */
export const createMessageMock = () => ({
  add: vi.fn(),
});

// ---------------------------------------------------------------------------
// Static-State Resets
// ---------------------------------------------------------------------------

export type TeardownOptions = {
  clearBody: boolean;
  clearLocalStorage: boolean;
};

const DEFAULT_TEARDOWN_OPTIONS = {
  clearBody: false,
  clearLocalStorage: false,
} satisfies TeardownOptions;

/** Clears internal state (rootStyleProperties, fontSizeOverride) on InlineStyleApplier between tests. */
export const resetInlineStyleApplierState = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (InlineStyleApplier as any)["rootStyleProperties"] = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (InlineStyleApplier as any)["fontSizeOverride"] = null;
};

/**
 * Installs the standard teardown used in every spec:
 * - restores all mocks
 * - clears document.body
 * Call inside a `describe` block.
 */
export const useStandardTeardown = ({ clearBody, clearLocalStorage }: Partial<TeardownOptions> = DEFAULT_TEARDOWN_OPTIONS): void => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();

    if (clearBody) {
      document.body.innerHTML = "";
    }

    if (clearLocalStorage) {
      localStorage.clear();
    }
  });
};
