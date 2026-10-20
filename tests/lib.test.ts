import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createConfig, createRedmineServer, type RedmineServer } from "../src/lib.js";

type Call = { url: string; apiKey: string | null };

/** Fake fetch that records calls and answers like a tiny Redmine. */
function fakeFetch(calls: Call[], download?: { body: Uint8Array; contentLength?: number }) {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, apiKey: new Headers(init?.headers).get("X-Redmine-API-Key") });
    if (url.includes("/attachments/download/")) {
      const body = download?.body ?? new Uint8Array();
      return new Response(body, {
        headers: {
          "content-type": "application/pdf",
          "content-length": String(download?.contentLength ?? body.length),
        },
      });
    }
    return Response.json({ user: { id: 1, login: "me" } });
  }) as typeof fetch;
}

async function callTool(rs: RedmineServer, name: string, args: Record<string, unknown> = {}) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "lib-test", version: "0.0.0" });
  await Promise.all([rs.server.connect(serverTransport), client.connect(clientTransport)]);
  const result = await client.callTool({ name, arguments: args });
  await client.close();
  return result as { isError?: boolean; content: { type: string; text: string }[] };
}

describe("createConfig", () => {
  it("applies the same defaults as loadConfig", () => {
    const config = createConfig({ baseUrl: "https://a.example", apiKey: "k" });
    expect(config).toMatchObject({
      REDMINE_BASE_URL: "https://a.example",
      REDMINE_API_KEY: "k",
      REDMINE_READONLY: false,
      REDMINE_ALLOW_RAW_REQUEST: false,
      REDMINE_HTTP_TIMEOUT_MS: 15_000,
      REDMINE_MAX_PAGES: 20,
    });
  });

  it("rejects invalid settings", () => {
    expect(() => createConfig({ baseUrl: "not a url", apiKey: "k" })).toThrow(/REDMINE_BASE_URL/);
    expect(() => createConfig({ baseUrl: "https://a.example", apiKey: "" })).toThrow(/REDMINE_API_KEY/);
  });
});

describe("createRedmineServer", () => {
  it("routes every call through the injected fetch with that connection's credentials", async () => {
    const callsA: Call[] = [];
    const callsB: Call[] = [];
    const a = createRedmineServer({
      config: createConfig({ baseUrl: "https://a.example", apiKey: "key-a" }),
      fetch: fakeFetch(callsA),
    });
    const b = createRedmineServer({
      config: createConfig({ baseUrl: "https://b.example", apiKey: "key-b" }),
      fetch: fakeFetch(callsB),
    });

    await callTool(a, "redmine_current_user");
    await callTool(b, "redmine_current_user");

    expect(callsA).toEqual([{ url: "https://a.example/users/current.json", apiKey: "key-a" }]);
    expect(callsB).toEqual([{ url: "https://b.example/users/current.json", apiKey: "key-b" }]);
  });

  it("honours a per-connection read-only flag", async () => {
    const calls: Call[] = [];
    const rs = createRedmineServer({
      config: createConfig({ baseUrl: "https://a.example", apiKey: "k", readonly: true }),
      fetch: fakeFetch(calls),
    });
    const result = await callTool(rs, "redmine_issue_add_comment", { id: 1, notes: "hi" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("REDMINE_READONLY");
    expect(calls).toHaveLength(0);
  });

  it("downloads attachments through the injected fetch", async () => {
    const calls: Call[] = [];
    const rs = createRedmineServer({
      config: createConfig({ baseUrl: "https://a.example", apiKey: "k" }),
      fetch: fakeFetch(calls, { body: new Uint8Array([1, 2, 3]) }),
    });
    const result = await callTool(rs, "redmine_attachment_download", { id: 7 });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(result.content[0].text)).toEqual({
      id: 7,
      content_type: "application/pdf",
      size: 3,
      content_base64: "AQID",
    });
    expect(calls).toEqual([{ url: "https://a.example/attachments/download/7", apiKey: "k" }]);
  });

  it("refuses oversized attachments based on Content-Length", async () => {
    const rs = createRedmineServer({
      config: createConfig({ baseUrl: "https://a.example", apiKey: "k", maxDownloadBytes: 1024 }),
      fetch: fakeFetch([], { body: new Uint8Array([1]), contentLength: 10_000 }),
    });
    const result = await callTool(rs, "redmine_attachment_download", { id: 7 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("exceeds REDMINE_MAX_DOWNLOAD_BYTES (1024)");
  });

  it("reports the package name and version on initialize", async () => {
    const rs = createRedmineServer({ config: createConfig({ baseUrl: "https://a.example", apiKey: "k" }) });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "lib-test", version: "0.0.0" });
    await Promise.all([rs.server.connect(serverTransport), client.connect(clientTransport)]);
    expect(client.getServerVersion()?.name).toBe("redmine-mcp-connector");
    await client.close();
  });
});
