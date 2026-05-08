import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { RedmineHttpError } from "../redmine/client.js";
import { confirmDestructiveSchema, idOrIdentifier } from "../util/schemas.js";
import { assertConfirmed, assertWritable } from "../util/safety.js";
import { toolJson } from "../util/result.js";

export function registerWikiTools(server: McpServer, ctx: AppContext): string[] {
  const names: string[] = [];
  const reg = (n: string) => names.push(n);

  server.registerTool(
    "redmine_wiki_pages_list",
    {
      description: "List wiki pages for a project (GET /projects/:id/wiki/index.json).",
      inputSchema: z.object({
        project_id: idOrIdentifier("project id or identifier"),
      }),
    },
    async ({ project_id }) => {
      try {
        const data = await ctx.client.get(
          `/projects/${encodeURIComponent(String(project_id))}/wiki/index.json`,
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
  reg("redmine_wiki_pages_list");

  server.registerTool(
    "redmine_wiki_page_get",
    {
      description: "Get wiki page (GET /projects/:project/wiki/:title.json).",
      inputSchema: z.object({
        project_id: idOrIdentifier("project id or identifier"),
        title: z.string().min(1),
        include: z.array(z.enum(["attachments"])).optional(),
      }),
    },
    async ({ project_id, title, include }) => {
      try {
        const data = await ctx.client.get(
          `/projects/${encodeURIComponent(String(project_id))}/wiki/${encodeURIComponent(title)}.json`,
          { include },
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
  reg("redmine_wiki_page_get");

  server.registerTool(
    "redmine_wiki_page_create_or_update",
    {
      description:
        "Create or update wiki page (PUT /projects/:project/wiki/:title.json). Redmine uses update for new pages.",
      inputSchema: z.object({
        project_id: idOrIdentifier("project id or identifier"),
        title: z.string().min(1),
        wiki_page: z.record(z.unknown()).describe("Typically { text: 'markdown body' } and optional parent_title, comments"),
      }),
    },
    async ({ project_id, title, wiki_page }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.put(
          `/projects/${encodeURIComponent(String(project_id))}/wiki/${encodeURIComponent(title)}.json`,
          { wiki_page },
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
  reg("redmine_wiki_page_create_or_update");

  server.registerTool(
    "redmine_wiki_page_delete",
    {
      description: "Delete wiki page (DELETE /projects/:project/wiki/:title.json). Requires confirm: true.",
      inputSchema: z.object({
        project_id: idOrIdentifier("project id or identifier"),
        title: z.string().min(1),
        ...confirmDestructiveSchema,
      }),
    },
    async ({ project_id, title, confirm }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      const c = assertConfirmed(confirm);
      if (c) return c;
      try {
        await ctx.client.delete(
          `/projects/${encodeURIComponent(String(project_id))}/wiki/${encodeURIComponent(title)}.json`,
        );
        return toolJson({ ok: true, title });
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_wiki_page_delete");

  return names;
}
