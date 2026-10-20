import "./setup.js";
import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadConfig } from "../src/config.js";
import { RedmineClient } from "../src/redmine/client.js";
import { registerAllTools } from "../src/register-tools.js";

const RAW_REQUEST_TOOLS = [
  "redmine_request_get",
  "redmine_request_post",
  "redmine_request_put",
  "redmine_request_delete",
];

function withRawRequest<T>(value: string | undefined, fn: () => T): T {
  const prev = process.env.REDMINE_ALLOW_RAW_REQUEST;
  if (value === undefined) delete process.env.REDMINE_ALLOW_RAW_REQUEST;
  else process.env.REDMINE_ALLOW_RAW_REQUEST = value;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.REDMINE_ALLOW_RAW_REQUEST;
    else process.env.REDMINE_ALLOW_RAW_REQUEST = prev;
  }
}

function buildServer() {
  const server = new McpServer({ name: "t", version: "0.0.0" });
  const config = loadConfig();
  const ctx = { config, client: new RedmineClient(config) };
  const names = registerAllTools(server, ctx);
  return { server, names };
}

async function listTools(server: McpServer) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "contract-test", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const { tools } = await client.listTools();
  await client.close();
  return tools;
}

describe("tool registration contract", () => {
  it("registers a broad set of uniquely named tools", () => {
    const { names } = buildServer();
    expect(names.length).toBeGreaterThanOrEqual(45);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) {
      expect(n).toMatch(/^redmine_/);
    }
  });

  it("registers the raw request tools only when REDMINE_ALLOW_RAW_REQUEST is true", () => {
    const off = withRawRequest(undefined, () => buildServer().names);
    for (const n of RAW_REQUEST_TOOLS) expect(off).not.toContain(n);

    const on = withRawRequest("true", () => buildServer().names);
    for (const n of RAW_REQUEST_TOOLS) expect(on).toContain(n);
  });

  // Anthropic Connectors Directory requirements: every tool has a title and
  // readOnlyHint or destructiveHint, and names are at most 64 characters.
  it("gives every tool a title, read/destructive hints and a short name", async () => {
    const { server } = withRawRequest("true", buildServer);
    const tools = await listTools(server);
    expect(tools.length).toBeGreaterThanOrEqual(45);

    for (const tool of tools) {
      const where = `tool ${tool.name}`;
      expect(tool.name.length, where).toBeLessThanOrEqual(64);
      expect(tool.title, where).toBeTruthy();
      expect(tool.annotations?.title, where).toBe(tool.title);
      expect(typeof tool.annotations?.readOnlyHint, where).toBe("boolean");
      if (tool.annotations?.readOnlyHint === false) {
        expect(typeof tool.annotations?.destructiveHint, where).toBe("boolean");
      }
    }
  });

  it("marks deletes as destructive and lists/gets as read-only", async () => {
    const { server } = withRawRequest("true", buildServer);
    const tools = await listTools(server);

    for (const tool of tools) {
      const where = `tool ${tool.name}`;
      if (/_(delete|remove_\w+|unlink_issue|archive)$/.test(tool.name)) {
        expect(tool.annotations?.destructiveHint, where).toBe(true);
      }
      if (/_(list|get)$/.test(tool.name)) {
        expect(tool.annotations?.readOnlyHint, where).toBe(true);
      }
    }
  });

  it("never mixes safe and unsafe HTTP methods in one tool", async () => {
    const { server } = withRawRequest("true", buildServer);
    const tools = await listTools(server);
    for (const tool of tools) {
      expect(Object.keys(tool.inputSchema.properties ?? {}), `tool ${tool.name}`).not.toContain("method");
    }
  });
});
