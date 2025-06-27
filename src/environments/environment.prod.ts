import packageJson from "@package.json";

export const environment = {
  production: false,
  version: packageJson.version,
};
