import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { confirmDestructiveSchema, idOrIdentifier, paginationSchema } from "../util/schemas.js";
import { assertConfirmed, assertWritable } from "../util/safety.js";
import { toolJson, toolRedmineError } from "../util/result.js";
import { destructiveTool, readTool, writeTool } from "../util/annotations.js";

export function registerMembershipTools(server: McpServer, ctx: AppContext): string[] {
  const names: string[] = [];
  const reg = (n: string) => names.push(n);

  server.registerTool(
    "redmine_project_memberships_list",
    {
      ...readTool("List project memberships"),
      description: "List project memberships (GET /projects/:id/memberships.json).",
      inputSchema: z.object({
        project_id: idOrIdentifier("project id or identifier"),
        ...paginationSchema,
      }),
    },
    async (input) => {
      try {
        const data = await ctx.client.get(
          `/projects/${encodeURIComponent(String(input.project_id))}/memberships.json`,
          { limit: input.limit, offset: input.offset },
        );
        return toolJson(data);
      } catch (e) {
        return toolRedmineError(e);
      }
    },
  );
  reg("redmine_project_memberships_list");

  server.registerTool(
    "redmine_membership_create",
    {
      ...writeTool("Add project member"),
      description: "Create membership (POST /projects/:project_id/memberships.json).",
      inputSchema: z.object({
        project_id: idOrIdentifier("project id or identifier"),
        membership: z.record(z.unknown()),
      }),
    },
    async ({ project_id, membership }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.post(
          `/projects/${encodeURIComponent(String(project_id))}/memberships.json`,
          { membership },
        );
        return toolJson(data);
      } catch (e) {
        return toolRedmineError(e);
      }
    },
  );
  reg("redmine_membership_create");

  server.registerTool(
    "redmine_membership_update",
    {
      ...destructiveTool("Update project membership roles"),
      description: "Update membership (PUT /memberships/:id.json).",
      inputSchema: z.object({
        id: z.coerce.number().int().positive(),
        membership: z.record(z.unknown()),
      }),
    },
    async ({ id, membership }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.put(`/memberships/${id}.json`, { membership });
        return toolJson(data);
      } catch (e) {
        return toolRedmineError(e);
      }
    },
  );
  reg("redmine_membership_update");

  server.registerTool(
    "redmine_membership_delete",
    {
      ...destructiveTool("Remove project member"),
      description: "Delete membership (DELETE /memberships/:id.json). Requires confirm: true.",
      inputSchema: z.object({
        id: z.coerce.number().int().positive(),
        ...confirmDestructiveSchema,
      }),
    },
    async ({ id, confirm }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      const c = assertConfirmed(confirm);
      if (c) return c;
      try {
        await ctx.client.delete(`/memberships/${id}.json`);
        return toolJson({ ok: true, deleted_id: id });
      } catch (e) {
        return toolRedmineError(e);
      }
    },
  );
  reg("redmine_membership_delete");

  return names;
}
