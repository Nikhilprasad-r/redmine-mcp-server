import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { RedmineHttpError } from "../redmine/client.js";
import { fetchAllRedmineList } from "../redmine/pagination.js";
import { confirmDestructiveSchema, idOrIdentifier, paginationSchema } from "../util/schemas.js";
import { assertConfirmed, assertWritable } from "../util/safety.js";
import { toolJson } from "../util/result.js";

const projectInclude = z.enum([
  "trackers",
  "issue_categories",
  "enabled_modules",
  "issue_custom_fields",
  "time_entry_activities",
]);

export function registerProjectTools(server: McpServer, ctx: AppContext): string[] {
  const names: string[] = [];
  const reg = (n: string) => names.push(n);

  server.registerTool(
    "redmine_projects_list",
    {
      description: "List projects (GET /projects.json).",
      inputSchema: z.object({
        ...paginationSchema,
        include: z.array(projectInclude).optional(),
        status: z.coerce.number().optional(),
      }),
    },
    async (input) => {
      try {
        const q: Record<string, unknown> = {
          include: input.include,
          status: input.status,
        };
        if (input.fetch_all) {
          const { items, total_count } = await fetchAllRedmineList<unknown>(
            ctx.client,
            "/projects.json",
            q,
            "projects",
            ctx.config.REDMINE_MAX_PAGES,
          );
          return toolJson({ projects: items, total_count, fetched: items.length });
        }
        const data = await ctx.client.get("/projects.json", {
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
  reg("redmine_projects_list");

  server.registerTool(
    "redmine_project_get",
    {
      description: "Get project (GET /projects/:id.json).",
      inputSchema: z.object({
        id: idOrIdentifier("project id or identifier"),
        include: z.array(projectInclude).optional(),
      }),
    },
    async ({ id, include }) => {
      try {
        const data = await ctx.client.get(`/projects/${encodeURIComponent(String(id))}.json`, {
          include,
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
  reg("redmine_project_get");

  server.registerTool(
    "redmine_project_create",
    {
      description: "Create project (POST /projects.json).",
      inputSchema: z.object({ project: z.record(z.unknown()) }),
    },
    async ({ project }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.post("/projects.json", { project });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_project_create");

  server.registerTool(
    "redmine_project_update",
    {
      description: "Update project (PUT /projects/:id.json).",
      inputSchema: z.object({
        id: idOrIdentifier("project id or identifier"),
        project: z.record(z.unknown()),
      }),
    },
    async ({ id, project }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.put(`/projects/${encodeURIComponent(String(id))}.json`, {
          project,
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
  reg("redmine_project_update");

  server.registerTool(
    "redmine_project_archive",
    {
      description: "Archive project (PUT /projects/:id/archive.json).",
      inputSchema: z.object({ id: idOrIdentifier("project id or identifier") }),
    },
    async ({ id }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.put(
          `/projects/${encodeURIComponent(String(id))}/archive.json`,
          {},
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
  reg("redmine_project_archive");

  server.registerTool(
    "redmine_project_unarchive",
    {
      description: "Unarchive project (PUT /projects/:id/unarchive.json).",
      inputSchema: z.object({ id: idOrIdentifier("project id or identifier") }),
    },
    async ({ id }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.put(
          `/projects/${encodeURIComponent(String(id))}/unarchive.json`,
          {},
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
  reg("redmine_project_unarchive");

  server.registerTool(
    "redmine_project_delete",
    {
      description: "Delete project (DELETE /projects/:id.json). Requires confirm: true.",
      inputSchema: z.object({
        id: idOrIdentifier("project id or identifier"),
        ...confirmDestructiveSchema,
      }),
    },
    async ({ id, confirm }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      const c = assertConfirmed(confirm);
      if (c) return c;
      try {
        await ctx.client.delete(`/projects/${encodeURIComponent(String(id))}.json`);
        return toolJson({ ok: true, deleted_id: id });
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_project_delete");

  return names;
}
