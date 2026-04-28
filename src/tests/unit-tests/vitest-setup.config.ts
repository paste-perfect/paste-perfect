import { vi } from "vitest";

Object.defineProperty(HTMLLinkElement.prototype, "href", {
  set(value) {
    this.setAttribute("data-href", value);
  },
  get() {
    return this.getAttribute("data-href") ?? "";
  },
  configurable: true,
});
