import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { RedmineHttpError } from "../redmine/client.js";
import { confirmDestructiveSchema, idOrIdentifier, paginationSchema } from "../util/schemas.js";
import { assertConfirmed, assertWritable } from "../util/safety.js";
import { toolJson } from "../util/result.js";

export function registerMembershipTools(server: McpServer, ctx: AppContext): string[] {
  const names: string[] = [];
  const reg = (n: string) => names.push(n);

  server.registerTool(
    "redmine_project_memberships_list",
    {
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
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_project_memberships_list");

  server.registerTool(
    "redmine_membership_create",
    {
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
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_membership_create");

  server.registerTool(
    "redmine_membership_update",
    {
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
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_membership_update");

  server.registerTool(
    "redmine_membership_delete",
    {
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
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_membership_delete");

  return names;
}
