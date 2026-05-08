import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { RedmineHttpError } from "../redmine/client.js";
import { fetchAllRedmineList } from "../redmine/pagination.js";
import { confirmDestructiveSchema, paginationSchema } from "../util/schemas.js";
import { assertConfirmed, assertWritable } from "../util/safety.js";
import { toolJson } from "../util/result.js";

export function registerUserTools(server: McpServer, ctx: AppContext): string[] {
  const names: string[] = [];
  const reg = (n: string) => names.push(n);

  server.registerTool(
    "redmine_current_user",
    {
      description: "Current user (GET /users/current.json).",
      inputSchema: z.object({
        include: z.array(z.enum(["memberships", "groups", "api_key", "auth_source"])).optional(),
      }),
    },
    async ({ include }) => {
      try {
        const data = await ctx.client.get("/users/current.json", { include });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_current_user");

  server.registerTool(
    "redmine_users_list",
    {
      description: "List users (GET /users.json). Admin may be required.",
      inputSchema: z.object({
        ...paginationSchema,
        status: z.coerce.number().optional(),
        name: z.string().optional(),
        group_id: z.coerce.number().optional(),
      }),
    },
    async (input) => {
      try {
        if (input.fetch_all) {
          const { items, total_count } = await fetchAllRedmineList<unknown>(
            ctx.client,
            "/users.json",
            { status: input.status, name: input.name, group_id: input.group_id },
            "users",
            ctx.config.REDMINE_MAX_PAGES,
          );
          return toolJson({ users: items, total_count, fetched: items.length });
        }
        const data = await ctx.client.get("/users.json", {
          status: input.status,
          name: input.name,
          group_id: input.group_id,
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
  reg("redmine_users_list");

  server.registerTool(
    "redmine_user_get",
    {
      description: "Get user (GET /users/:id.json).",
      inputSchema: z.object({
        id: z.coerce.number().int().positive(),
        include: z.array(z.enum(["memberships", "groups"])).optional(),
      }),
    },
    async ({ id, include }) => {
      try {
        const data = await ctx.client.get(`/users/${id}.json`, { include });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_user_get");

  server.registerTool(
    "redmine_user_create",
    {
      description: "Create user (POST /users.json).",
      inputSchema: z.object({ user: z.record(z.unknown()) }),
    },
    async ({ user }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.post("/users.json", { user });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_user_create");

  server.registerTool(
    "redmine_user_update",
    {
      description: "Update user (PUT /users/:id.json).",
      inputSchema: z.object({
        id: z.coerce.number().int().positive(),
        user: z.record(z.unknown()),
      }),
    },
    async ({ id, user }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.put(`/users/${id}.json`, { user });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_user_update");

  server.registerTool(
    "redmine_user_delete",
    {
      description: "Delete user (DELETE /users/:id.json). Requires confirm: true.",
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
        await ctx.client.delete(`/users/${id}.json`);
        return toolJson({ ok: true, deleted_id: id });
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_user_delete");

  return names;
}
