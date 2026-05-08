import "./setup.js";
import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadConfig } from "../src/config.js";
import { RedmineClient } from "../src/redmine/client.js";
import { registerAllTools } from "../src/register-tools.js";

describe("tool registration contract", () => {
  it("registers a broad set of uniquely named tools", () => {
    const server = new McpServer({ name: "t", version: "0.0.0" });
    const config = loadConfig();
    const ctx = { config, client: new RedmineClient(config) };
    const names = registerAllTools(server, ctx);
    expect(names.length).toBeGreaterThanOrEqual(45);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) {
      expect(n).toMatch(/^redmine_/);
    }
  });

  it("registers redmine_request when REDMINE_ALLOW_RAW_REQUEST is true", () => {
    const prev = process.env.REDMINE_ALLOW_RAW_REQUEST;
    process.env.REDMINE_ALLOW_RAW_REQUEST = "true";
    const server = new McpServer({ name: "t", version: "0.0.0" });
    const config = loadConfig();
    const ctx = { config, client: new RedmineClient(config) };
    const names = registerAllTools(server, ctx);
    expect(names).toContain("redmine_request");
    if (prev === undefined) delete process.env.REDMINE_ALLOW_RAW_REQUEST;
    else process.env.REDMINE_ALLOW_RAW_REQUEST = prev;
  });
});
