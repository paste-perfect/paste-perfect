import { describe, it, expect } from "vitest";
import { format } from "prettier/standalone";
import plugin from "@services/prettier/sql-plugin";
describe("browser SQL formatter", () => {
  it("preserves SQL literals and formats with the selected indentation", async () => {
    const result = await format("SELECT name, 'hello world' FROM users WHERE id = 1;", { parser: "sql", plugins: [plugin], tabWidth: 4 });
    expect(result).toContain("'hello world'");
    expect(result).toContain("\n    name");
    expect(result).toContain("FROM\n    users");
    expect(result.endsWith(";\n")).toBe(true);
  });
});
