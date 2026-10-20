import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { paginationSchema } from "../util/schemas.js";
import { toolJson, toolRedmineError } from "../util/result.js";
import { readTool } from "../util/annotations.js";

/** Read-only group tools (list/get). Mutations omitted by design. */
export function registerGroupTools(server: McpServer, ctx: AppContext): string[] {
  const names: string[] = [];
  const reg = (n: string) => names.push(n);

  server.registerTool(
    "redmine_groups_list",
    {
      ...readTool("List groups"),
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
        return toolRedmineError(e);
      }
    },
  );
  reg("redmine_groups_list");

  server.registerTool(
    "redmine_group_get",
    {
      ...readTool("Get group"),
      description: "Get group (GET /groups/:id.json).",
      inputSchema: z.object({ id: z.coerce.number().int().positive() }),
    },
    async ({ id }) => {
      try {
        const data = await ctx.client.get(`/groups/${id}.json`);
        return toolJson(data);
      } catch (e) {
        return toolRedmineError(e);
      }
    },
  );
  reg("redmine_group_get");

  return names;
}
