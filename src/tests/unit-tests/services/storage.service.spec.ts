import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TestBed } from "@angular/core/testing";
import { StorageService } from "@services/storage.service";

describe("StorageService", () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StorageService],
    });

    service = TestBed.inject(StorageService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("setItem", () => {
    it("should persist a primitive string value to localStorage", () => {
      service.setItem("lang", "typescript");
      expect(localStorage.getItem("lang")).toBe(JSON.stringify("typescript"));
    });

    it("should persist a number value to localStorage", () => {
      service.setItem("indent", 4);
      expect(localStorage.getItem("indent")).toBe("4");
    });

    it("should persist a plain object as JSON to localStorage", () => {
      const settings = { indentationSize: 2, enableFormatting: true };
      service.setItem("settings", settings);
      expect(JSON.parse(localStorage.getItem("settings")!)).toEqual(settings);
    });

    it("should overwrite an existing key with the new value", () => {
      service.setItem("lang", "javascript");
      service.setItem("lang", "typescript");
      expect(JSON.parse(localStorage.getItem("lang")!)).toBe("typescript");
    });

    it("should delegate to localStorage.setItem exactly once per call", () => {
      const spy = vi.spyOn(localStorage, "setItem");
      service.setItem("key", "value");
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("key", JSON.stringify("value"));
    });
  });

  describe("getItem", () => {
    it("should return null when the key does not exist in localStorage", () => {
      expect(service.getItem("nonexistent")).toBeNull();
    });

    it('should return null when the stored value is the string "undefined"', () => {
      localStorage.setItem("bad", "undefined");
      expect(service.getItem("bad")).toBeNull();
    });

    it("should retrieve and deserialize a stored string value", () => {
      localStorage.setItem("lang", JSON.stringify("typescript"));
      expect(service.getItem<string>("lang")).toBe("typescript");
    });

    it("should retrieve and deserialize a stored number value", () => {
      localStorage.setItem("indent", JSON.stringify(4));
      expect(service.getItem<number>("indent")).toBe(4);
    });

    it("should retrieve and deserialize a stored object value", () => {
      const settings = { indentationSize: 2, enableFormatting: true };
      localStorage.setItem("settings", JSON.stringify(settings));
      expect(service.getItem<typeof settings>("settings")).toEqual(settings);
    });

    it("should return a round-trip value identical to what was stored via setItem", () => {
      const payload = { theme: "dark", size: 14 };
      service.setItem("prefs", payload);
      expect(service.getItem<typeof payload>("prefs")).toEqual(payload);
    });
  });
});
