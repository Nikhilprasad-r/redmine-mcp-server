import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "./config.js";
import type { AppContext } from "./context.js";
import { RedmineClient, type RedmineClientOptions } from "./redmine/client.js";
import { registerAllTools } from "./register-tools.js";
import { registerResources } from "./register-resources.js";

// Resolves to the package root from both src/ (tsx) and dist/ (built).
const pkg = createRequire(import.meta.url)("../package.json") as { name: string; version: string };

export const DEFAULT_INSTRUCTIONS =
  "Tools call Redmine's REST API using the configured API key. Prefer redmine_issues_list / redmine_issue_get before edits. Destructive tools require confirm: true. Set REDMINE_READONLY=true to block all writes.";

export type CreateRedmineServerOptions = {
  config: AppConfig;
  /** fetch used for every Redmine call; hosted deployments pass an SSRF-guarded one. */
  fetch?: RedmineClientOptions["fetch"];
  /** Overrides the server instructions sent to the client on initialize. */
  instructions?: string;
};

export type RedmineServer = {
  server: McpServer;
  ctx: AppContext;
  toolNames: string[];
};

/**
 * Build a fully registered Redmine MCP server for one Redmine connection.
 * Connect it to any transport (stdio, Streamable HTTP, in-memory).
 */
export function createRedmineServer(options: CreateRedmineServerOptions): RedmineServer {
  const { config } = options;
  const client = new RedmineClient(config, { fetch: options.fetch });
  const ctx: AppContext = { config, client };

  const server = new McpServer(
    { name: pkg.name, version: pkg.version },
    { instructions: options.instructions ?? DEFAULT_INSTRUCTIONS },
  );

  registerResources(server, ctx);
  const toolNames = registerAllTools(server, ctx);
  return { server, ctx, toolNames };
}
