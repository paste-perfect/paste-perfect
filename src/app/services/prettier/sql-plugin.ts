import type { Plugin } from "prettier";
import { format } from "sql-formatter";

// Only the SQL formatter is used by this app. The upstream multi-engine plugin
// also bundles node-sql-parser and every dialect, adding tens of megabytes.
const plugin: Plugin<string> = {
  parsers: {
    sql: {
      parse: (text) => text,
      astFormat: "sql",
      locStart: () => 0,
      locEnd: (text) => text.length,
    },
  },
  printers: {
    sql: {
      print: (path, options) => format(path.node, { language: "sql", tabWidth: options.tabWidth, useTabs: options.useTabs }) + "\n",
    },
  },
};
export default plugin;
