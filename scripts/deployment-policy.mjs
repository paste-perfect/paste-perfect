export const siteUrl = "https://paste-perfect.github.io/paste-perfect-test/";

export function validateMetadata(metadata, expectedSha) {
  if (metadata.repository !== "paste-perfect/paste-perfect" || !/^[a-f0-9]{40}$/.test(metadata.sha ?? "")) {
    throw new Error("Invalid source repository or commit SHA.");
  }
  if (metadata.target !== "preview" || metadata.base !== "/paste-perfect-test/") {
    throw new Error("Expected a preview build with the test base path.");
  }
  if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(metadata.version ?? "")) throw new Error("Preview is missing its release version tag.");
  if (expectedSha && metadata.sha !== expectedSha) throw new Error("Pages has not published the expected source commit yet.");
  return metadata.sha;
}

export function assetUrls(html) {
  if (!/<base\s+href=["']\/paste-perfect-test\/["']\s*\/?\s*>/i.test(html)) throw new Error("Incorrect HTML base path.");
  const refs = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)].map((match) => new URL(match[1], siteUrl));
  if (!refs.some((url) => url.pathname.endsWith(".js"))) throw new Error("No application script found.");
  for (const url of refs)
    if (url.origin !== new URL(siteUrl).origin || !url.pathname.startsWith("/paste-perfect-test/"))
      throw new Error("Asset points outside the test deployment.");
  return refs;
}
