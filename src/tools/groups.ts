import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { RedmineHttpError } from "../redmine/client.js";
import { paginationSchema } from "../util/schemas.js";
import { toolJson } from "../util/result.js";

/** Read-only group tools (list/get). Mutations omitted by design. */
export function registerGroupTools(server: McpServer, ctx: AppContext): string[] {
  const names: string[] = [];
  const reg = (n: string) => names.push(n);

  server.registerTool(
    "redmine_groups_list",
    {
      description: "List groups (GET /groups.json). May require admin permissions.",
      inputSchema: z.object({ ...paginationSchema }),
    },
    async (input) => {
      try {
        const data = await ctx.client.get("/groups.json", {
          limit: input.limit,
          offset: input.offset,
        });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_groups_list");

  server.registerTool(
    "redmine_group_get",
    {
      description: "Get group (GET /groups/:id.json).",
      inputSchema: z.object({ id: z.coerce.number().int().positive() }),
    },
    async ({ id }) => {
      try {
        const data = await ctx.client.get(`/groups/${id}.json`);
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_group_get");

  return names;
}
