/**
 * vite-setup.config.ts
 *
 * Global Happy DOM patches applied before every test file runs.
 */

// ---------------------------------------------------------------------------
// HTMLLinkElement.href patch
//
// Happy DOM throws a synchronous DOMException when `link.href` is assigned
// while CSS file loading is disabled. We replace the property with a no-op
// setter that stores the value in a data attribute so tests can still assert
// on the resolved href (e.g. ThemeService link management tests).
// ---------------------------------------------------------------------------
Object.defineProperty(HTMLLinkElement.prototype, "href", {
  set(value: string) {
    this.setAttribute("data-href", value);
  },
  get() {
    return this.getAttribute("data-href") ?? "";
  },
  configurable: true,
});
