import { describe, it, expect, afterEach, vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { MessageService } from "primeng/api";
import { DARK_THEME_MAP, LIGHT_THEME_MAP, THEME_STORAGE_KEY } from "@constants";
import { SelectableTheme, Theme } from "@types";
import { ThemeService } from "@services/theme.service";
import { StorageService } from "@services/storage.service";
import { createStorageMock, createMessageMock } from "../test-utils";

const buildAllThemes = (): SelectableTheme[] => {
  const mapThemes = <T extends Theme>(themeMap: Record<T, string>): SelectableTheme[] =>
    (Object.entries(themeMap) as [T, string][]).map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));

  return [...mapThemes(LIGHT_THEME_MAP), ...mapThemes(DARK_THEME_MAP)];
};

const createService = (storedThemeValue: string | null = null) => {
  const storageMock = createStorageMock(storedThemeValue);
  const messageMock = createMessageMock();

  TestBed.configureTestingModule({
    providers: [ThemeService, { provide: StorageService, useValue: storageMock }, { provide: MessageService, useValue: messageMock }],
  });

  return { service: TestBed.inject(ThemeService), storageMock, messageMock };
};

const cleanupPrismLink = () => document.getElementById("prism-theme")?.remove();

describe("ThemeService", () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    cleanupPrismLink();
  });

  it("should be created", () => {
    const { service } = createService();
    expect(service).toBeTruthy();
  });

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
      const _ = service.selectedTheme;

      expect(storageMock.setItem).toHaveBeenCalledTimes(1);
    });

    describe("DOM: <link> element management", () => {
      it("should create a <link> element and set its href when none exists yet", () => {
        cleanupPrismLink();
        const { service } = createService();

        service.selectedTheme = buildAllThemes()[0];

        const link = document.getElementById("prism-theme") as HTMLLinkElement;
        expect(link).toBeTruthy();
        expect(link.rel).toBe("stylesheet");
        expect(link.href).toContain(`prism-themes/${buildAllThemes()[0].value}.css`);
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
        (document.getElementById("prism-theme") as HTMLLinkElement).onerror!(new Event("error"));

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

  describe("getAllThemes", () => {
    it("should return a combined list of all light and dark themes", () => {
      const { service } = createService();
      const expectedCount = Object.keys(LIGHT_THEME_MAP).length + Object.keys(DARK_THEME_MAP).length;
      expect(service.getAllThemes()).toHaveLength(expectedCount);
    });

    it("should return themes sorted alphabetically by label", () => {
      const { service } = createService();
      expect(service.getAllThemes()).toEqual(buildAllThemes());
    });

    it("should return a new array reference on each call (immutability guard)", () => {
      const { service } = createService();
      expect(service.getAllThemes()).not.toBe(service.getAllThemes());
    });
  });

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
