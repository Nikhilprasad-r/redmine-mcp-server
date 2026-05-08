import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { RedmineHttpError } from "../redmine/client.js";
import { confirmDestructiveSchema, idOrIdentifier, paginationSchema } from "../util/schemas.js";
import { assertConfirmed, assertWritable } from "../util/safety.js";
import { toolJson } from "../util/result.js";

export function registerNewsTools(server: McpServer, ctx: AppContext): string[] {
  const names: string[] = [];
  const reg = (n: string) => names.push(n);

  server.registerTool(
    "redmine_news_list",
    {
      description: "List news (GET /news.json).",
      inputSchema: z.object({
        ...paginationSchema,
        project_id: idOrIdentifier("project id").optional(),
      }),
    },
    async (input) => {
      try {
        const data = await ctx.client.get("/news.json", {
          project_id: input.project_id,
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
  reg("redmine_news_list");

  server.registerTool(
    "redmine_news_get",
    {
      description: "Get news item (GET /news/:id.json).",
      inputSchema: z.object({ id: z.coerce.number().int().positive() }),
    },
    async ({ id }) => {
      try {
        const data = await ctx.client.get(`/news/${id}.json`);
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_news_get");

  server.registerTool(
    "redmine_news_create",
    {
      description: "Create news (POST /projects/:project_id/news.json or POST /news.json with project identifier).",
      inputSchema: z.object({
        project_id: idOrIdentifier("project id or identifier"),
        news: z.record(z.unknown()),
      }),
    },
    async ({ project_id, news }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.post(
          `/projects/${encodeURIComponent(String(project_id))}/news.json`,
          { news },
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
  reg("redmine_news_create");

  server.registerTool(
    "redmine_news_update",
    {
      description: "Update news (PUT /news/:id.json).",
      inputSchema: z.object({
        id: z.coerce.number().int().positive(),
        news: z.record(z.unknown()),
      }),
    },
    async ({ id, news }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.put(`/news/${id}.json`, { news });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_news_update");

  server.registerTool(
    "redmine_news_delete",
    {
      description: "Delete news (DELETE /news/:id.json). Requires confirm: true.",
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
        await ctx.client.delete(`/news/${id}.json`);
        return toolJson({ ok: true, deleted_id: id });
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_news_delete");

  return names;
}
