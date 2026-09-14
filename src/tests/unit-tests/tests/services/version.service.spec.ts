import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VersionService } from "@services/version.service";

describe("VersionService", () => {
  beforeEach(() => vi.spyOn(document, "baseURI", "get").mockReturnValue("https://paste-perfect.github.io/paste-perfect-test/"));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each(["v2.10.0-rc.1", "v2.10.0"])("shows %s and links to its release", async (version) => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ repository: "paste-perfect/paste-perfect", version }) });
    vi.stubGlobal("fetch", fetchMock);
    const service = new VersionService();
    await service.load();
    expect(service.version()).toBe(version);
    expect(service.releaseUrl()).toBe(`https://github.com/paste-perfect/paste-perfect/releases/tag/${version}`);
    expect(fetchMock.mock.calls[0][0].href).toBe(new URL("deployment.json", document.baseURI).href);
  });

  it.each([{ version: "d44c424" }, { version: "v2.10.0", repository: "other/repo" }, { version: null }])(
    "rejects invalid metadata: %j",
    async (metadata) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true, json: async () => ({ repository: "paste-perfect/paste-perfect", ...metadata }) })
      );
      const service = new VersionService();
      const initial = service.version();
      await service.load();
      expect(service.version()).toBe(initial);
      expect(service.releaseUrl()).toBe("https://github.com/paste-perfect/paste-perfect/releases");
    }
  );

  it("keeps the application usable when metadata cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
    const service = new VersionService();
    await expect(service.load()).resolves.toBeUndefined();
  });
});
