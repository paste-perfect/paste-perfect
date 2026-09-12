import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
const root = resolve(process.argv[2] || "dist/paste-perfect/browser");
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (!pathname.startsWith("/paste-perfect/")) {
      response.writeHead(404).end();
      return;
    }
    const file = resolve(root, pathname.slice("/paste-perfect/".length) || "index.html");
    if (!file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const content = await readFile(file);
    response.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" }).end(content);
  } catch {
    response.writeHead(404).end();
  }
}).listen(4201, "127.0.0.1", () => console.log("Production artifact: http://127.0.0.1:4201/paste-perfect/"));
