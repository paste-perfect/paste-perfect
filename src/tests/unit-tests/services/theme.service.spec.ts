import { describe, it, expect, afterEach, vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { MessageService } from "primeng/api";
import { DARK_THEME_MAP, LIGHT_THEME_MAP, THEME_STORAGE_KEY } from "@constants";
import { SelectableTheme } from "@types";
import { getEntries } from "@utils/utils";
import { ThemeService } from "@services/theme.service";
import { StorageService } from "@services/storage.service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Mirrors the service's internal theme-list construction.
 * Light themes come first (matching getAllThemes order), then sorted by label.
 */
const buildAllThemes = (): SelectableTheme[] => {
  const lightThemes = getEntries(LIGHT_THEME_MAP)
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const darkThemes = getEntries(DARK_THEME_MAP)
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return [...lightThemes, ...darkThemes];
};

/**
 * Bootstraps a fresh TestBed + ThemeService for the given stored theme value.
 * Isolates per-test setup from shared `beforeEach` to avoid stale state.
 */
const createService = (storedThemeValue: string | null = null) => {
  const storageMock = {
    getItem: vi.fn().mockReturnValue(storedThemeValue),
    setItem: vi.fn(),
  };
  const messageMock = {
    add: vi.fn(),
  };

  TestBed.configureTestingModule({
    providers: [ThemeService, { provide: StorageService, useValue: storageMock }, { provide: MessageService, useValue: messageMock }],
  });

  return {
    service: TestBed.inject(ThemeService),
    storageMock,
    messageMock,
  };
};

/** Remove any prism stylesheet link injected by the service under test. */
const cleanupPrismLink = () => document.getElementById("prism-theme")?.remove();

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("ThemeService", () => {
  afterEach(() => {
    // 1. Tear down Angular first — teardown hooks may still reference mocks.
    TestBed.resetTestingModule();
    // 2. Then restore all spies/mocks.
    vi.restoreAllMocks();
    // 3. Clean up any DOM side-effects from applyTheme.
    cleanupPrismLink();
  });

  // ── Instantiation ──────────────────────────────────────────────────────────

  describe("instantiation", () => {
    it("should be created", () => {
      const { service } = createService();
      expect(service).toBeTruthy();
    });
  });

  // ── Initial theme resolution ───────────────────────────────────────────────

  describe("initial theme resolution", () => {
    it("should default to the first sorted theme when storage is empty", () => {
      const { service } = createService(null);
      expect(service.selectedTheme).toEqual(buildAllThemes()[0]);
    });

    it("should restore the previously persisted theme on initialisation", () => {
      const target = buildAllThemes()[2];
      const { service } = createService(target.value);
      expect(service.selectedTheme).toEqual(target);
    });

    it("should fall back to the first theme when storage contains an unrecognised value", () => {
      const { service } = createService("__unknown_theme__");
      expect(service.selectedTheme).toEqual(buildAllThemes()[0]);
    });
  });

  // ── selectedTheme setter ──────────────────────────────────────────────────

  describe("selectedTheme setter", () => {
    it("should update the selected theme to the newly assigned value", () => {
      const { service } = createService();
      const newTheme = buildAllThemes()[1];

      service.selectedTheme = newTheme;

      expect(service.selectedTheme).toEqual(newTheme);
    });

    it("should persist the new theme value to StorageService", () => {
      const { service, storageMock } = createService();
      const newTheme = buildAllThemes()[1];

      service.selectedTheme = newTheme;

      expect(storageMock.setItem).toHaveBeenCalledExactlyOnceWith(THEME_STORAGE_KEY, newTheme.value);
    });

    it("should call setItem only once per assignment, not on read", () => {
      const { service, storageMock } = createService();

      service.selectedTheme = buildAllThemes()[0];
      // Read the getter — must not trigger another persist.
      const _ = service.selectedTheme;

      expect(storageMock.setItem).toHaveBeenCalledTimes(1);
    });

    describe("DOM: <link> element management", () => {
      it("should create a <link> element and set its href when none exists yet", () => {
        // Guarantee no pre-existing link from constructor path.
        cleanupPrismLink();
        const { service } = createService();
        const newTheme = buildAllThemes()[0];

        service.selectedTheme = newTheme;

        const link = document.getElementById("prism-theme") as HTMLLinkElement;
        expect(link).toBeTruthy();
        expect(link.rel).toBe("stylesheet");
        expect(link.href).toContain(`prism-themes/${newTheme.value}.css`);
      });

      it("should reuse the existing <link> element rather than creating a duplicate", () => {
        const preExisting = document.createElement("link");
        preExisting.id = "prism-theme";
        document.head.appendChild(preExisting);

        const { service } = createService();
        const newTheme = buildAllThemes()[1];

        service.selectedTheme = newTheme;

        expect(document.querySelectorAll("#prism-theme")).toHaveLength(1);
        expect((document.getElementById("prism-theme") as HTMLLinkElement).href).toContain(newTheme.value);
      });

      it("should update the href when the theme changes a second time", () => {
        const { service } = createService();
        const [first, second] = buildAllThemes();

        service.selectedTheme = first;
        service.selectedTheme = second;

        const link = document.getElementById("prism-theme") as HTMLLinkElement;
        expect(link.href).toContain(second.value);
        expect(link.href).not.toContain(first.value);
      });
    });

    describe("DOM: stylesheet error handling", () => {
      it("should display an error toast when the stylesheet fails to load", () => {
        const { service, messageMock } = createService();
        const newTheme = buildAllThemes()[0];

        service.selectedTheme = newTheme;

        const link = document.getElementById("prism-theme") as HTMLLinkElement;
        // Simulate a network/resource load failure.
        link.onerror!(new Event("error"));

        expect(messageMock.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: "error",
            summary: "Theme Load Failed",
            detail: expect.stringContaining(newTheme.value),
          })
        );
      });

      it("should not show an error toast when the stylesheet loads successfully", () => {
        const { service, messageMock } = createService();

        service.selectedTheme = buildAllThemes()[0];

        expect(messageMock.add).not.toHaveBeenCalled();
      });
    });
  });

  // ── getAllThemes ───────────────────────────────────────────────────────────

  describe("getAllThemes", () => {
    it("should return a combined list of all light and dark themes", () => {
      const { service } = createService();
      const expectedCount = Object.keys(LIGHT_THEME_MAP).length + Object.keys(DARK_THEME_MAP).length;

      expect(service.getAllThemes()).toHaveLength(expectedCount);
    });

    it("should return themes sorted alphabetically by label", () => {
      const { service } = createService();
      const themes = service.getAllThemes();
      const sorted = buildAllThemes();

      expect(themes).toEqual(sorted);
    });

    it("should return a new array reference on each call (immutability guard)", () => {
      const { service } = createService();
      expect(service.getAllThemes()).not.toBe(service.getAllThemes());
    });
  });

  // ── getLightThemes ────────────────────────────────────────────────────────

  describe("getLightThemes", () => {
    it("should return exactly the number of entries in LIGHT_THEME_MAP", () => {
      const { service } = createService();
      expect(service.getLightThemes()).toHaveLength(Object.keys(LIGHT_THEME_MAP).length);
    });

    it("should return only themes whose values exist in LIGHT_THEME_MAP", () => {
      const { service } = createService();
      const lightValues = new Set(Object.keys(LIGHT_THEME_MAP));

      service.getLightThemes().forEach((t) => expect(lightValues.has(t.value)).toBe(true));
    });
  });

  // ── getDarkThemes ─────────────────────────────────────────────────────────

  describe("getDarkThemes", () => {
    it("should return exactly the number of entries in DARK_THEME_MAP", () => {
      const { service } = createService();
      expect(service.getDarkThemes()).toHaveLength(Object.keys(DARK_THEME_MAP).length);
    });

    it("should return only themes whose values exist in DARK_THEME_MAP", () => {
      const { service } = createService();
      const darkValues = new Set(Object.keys(DARK_THEME_MAP));

      service.getDarkThemes().forEach((t) => expect(darkValues.has(t.value)).toBe(true));
    });
  });
});
