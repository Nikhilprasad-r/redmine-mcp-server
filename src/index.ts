#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import type { AppContext } from "./context.js";
import { RedmineClient } from "./redmine/client.js";
import { registerAllTools } from "./register-tools.js";
import { registerResources } from "./register-resources.js";

async function main() {
  const config = loadConfig();
  const client = new RedmineClient(config);
  const ctx: AppContext = { config, client };

  const server = new McpServer(
    { name: "redmine-mcp", version: "1.0.0" },
    {
      instructions:
        "Tools call Redmine's REST API using the configured API key. Prefer redmine_issues_list / redmine_issue_get before edits. Destructive tools require confirm: true. Set REDMINE_READONLY=true to block all writes.",
    },
  );

  registerResources(server, ctx);
  registerAllTools(server, ctx);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  console.error(msg);
  process.exit(1);
});
