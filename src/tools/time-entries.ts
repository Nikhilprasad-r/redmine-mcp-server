import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { RedmineHttpError } from "../redmine/client.js";
import { fetchAllRedmineList } from "../redmine/pagination.js";
import { confirmDestructiveSchema, paginationSchema } from "../util/schemas.js";
import { assertConfirmed, assertWritable } from "../util/safety.js";
import { toolJson } from "../util/result.js";

export function registerTimeEntryTools(server: McpServer, ctx: AppContext): string[] {
  const names: string[] = [];
  const reg = (n: string) => names.push(n);

  server.registerTool(
    "redmine_time_entries_list",
    {
      description: "List time entries (GET /time_entries.json).",
      inputSchema: z.object({
        ...paginationSchema,
        project_id: z.coerce.number().optional(),
        issue_id: z.coerce.number().optional(),
        user_id: z.coerce.number().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        activity_id: z.coerce.number().optional(),
      }),
    },
    async (input) => {
      try {
        const q: Record<string, unknown> = {
          project_id: input.project_id,
          issue_id: input.issue_id,
          user_id: input.user_id,
          from: input.from,
          to: input.to,
          activity_id: input.activity_id,
        };
        if (input.fetch_all) {
          const { items, total_count } = await fetchAllRedmineList<unknown>(
            ctx.client,
            "/time_entries.json",
            q,
            "time_entries",
            ctx.config.REDMINE_MAX_PAGES,
          );
          return toolJson({ time_entries: items, total_count, fetched: items.length });
        }
        const data = await ctx.client.get("/time_entries.json", {
          ...q,
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
  reg("redmine_time_entries_list");

  server.registerTool(
    "redmine_time_entry_get",
    {
      description: "Get time entry (GET /time_entries/:id.json).",
      inputSchema: z.object({ id: z.coerce.number().int().positive() }),
    },
    async ({ id }) => {
      try {
        const data = await ctx.client.get(`/time_entries/${id}.json`);
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_time_entry_get");

  server.registerTool(
    "redmine_time_entry_create",
    {
      description: "Create time entry (POST /time_entries.json).",
      inputSchema: z.object({ time_entry: z.record(z.unknown()) }),
    },
    async ({ time_entry }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.post("/time_entries.json", { time_entry });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_time_entry_create");

  server.registerTool(
    "redmine_time_entry_update",
    {
      description: "Update time entry (PUT /time_entries/:id.json).",
      inputSchema: z.object({
        id: z.coerce.number().int().positive(),
        time_entry: z.record(z.unknown()),
      }),
    },
    async ({ id, time_entry }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.put(`/time_entries/${id}.json`, { time_entry });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_time_entry_update");

  server.registerTool(
    "redmine_time_entry_delete",
    {
      description: "Delete time entry (DELETE /time_entries/:id.json). Requires confirm: true.",
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
        await ctx.client.delete(`/time_entries/${id}.json`);
        return toolJson({ ok: true, deleted_id: id });
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_time_entry_delete");

  return names;
}
