import { computed, Injectable, signal } from "@angular/core";
import { environment } from "@environments/environment";

@Injectable({ providedIn: "root" })
export class VersionService {
  readonly version = signal(environment.version);
  readonly releaseUrl = computed(() => {
    const tag = this.version();
    return /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)
      ? `https://github.com/paste-perfect/paste-perfect/releases/tag/${encodeURIComponent(tag)}`
      : "https://github.com/paste-perfect/paste-perfect/releases";
  });

  constructor() {
    if (environment.production) void this.load();
  }

  async load(): Promise<void> {
    try {
      const response = await fetch(new URL("deployment.json", document.baseURI), {
        cache: "no-cache",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return;
      const metadata: { repository?: string; version?: unknown } = await response.json();
      if (
        metadata.repository === "paste-perfect/paste-perfect" &&
        typeof metadata.version === "string" &&
        /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(metadata.version)
      ) {
        this.version.set(metadata.version);
      }
    } catch {
      // Unpublished/local artifacts remain usable if release metadata is unavailable.
    }
  }
}
