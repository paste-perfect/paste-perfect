/**
 * test-utils.ts
 *
 * Shared factories, stubs, and reset helpers used across multiple spec files.
 * Only add things here when they appear in TWO OR MORE test files.
 */
import { vi } from "vitest";
import { InlineStyleApplier } from "@utils/inline-style-applier";
import { LanguageDefinition } from "@types";
import { IndentationMode } from "@constants";

// ---------------------------------------------------------------------------
// Language & Settings Factories
// ---------------------------------------------------------------------------

export const makeLanguage = (value = "typescript", dependencies: string[] = [], customImportPath?: string): LanguageDefinition =>
  ({
    title: value,
    value,
    filterAlias: [],
    prismConfiguration: { dependencies, customImportPath },
  }) as unknown as LanguageDefinition;

type EditorSettingsOverrides = Partial<{
  showLineNumbers: boolean;
  indentationSize: number;
  indentationMode: IndentationMode;
  enableFormatting: boolean;
}>;

/** Returns a plain settings object with sensible defaults, accepting partial overrides. */
export const makeEditorSettings = (overrides: EditorSettingsOverrides = {}) => ({
  showLineNumbers: true,
  indentationSize: 2,
  indentationMode: IndentationMode.Spaces,
  enableFormatting: true,
  ...overrides,
});

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
  Object.defineProperty(el, "outerText", {
    value: outerText,
    writable: true,
    configurable: true,
  });
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

/** Clears internal rootStyleProperties cache on InlineStyleApplier between tests. */
export const resetInlineStyleApplierState = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (InlineStyleApplier as any)["rootStyleProperties"] = {};
};
