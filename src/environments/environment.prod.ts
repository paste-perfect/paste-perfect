declare const BUILD_VERSION: string;

export const environment = {
  production: true,
  version: typeof BUILD_VERSION === "undefined" ? "LOCAL" : BUILD_VERSION,
};
