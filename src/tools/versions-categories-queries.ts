import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { RedmineHttpError } from "../redmine/client.js";
import { confirmDestructiveSchema, idOrIdentifier, paginationSchema } from "../util/schemas.js";
import { assertConfirmed, assertWritable } from "../util/safety.js";
import { toolJson } from "../util/result.js";

export function registerVersionsCategoriesQueriesTools(
  server: McpServer,
  ctx: AppContext,
): string[] {
  const names: string[] = [];
  const reg = (n: string) => names.push(n);

  // --- Versions ---
  server.registerTool(
    "redmine_versions_list",
    {
      description: "List versions / roadmap for a project (GET /projects/:id/versions.json).",
      inputSchema: z.object({ project_id: idOrIdentifier("project id or identifier") }),
    },
    async ({ project_id }) => {
      try {
        const data = await ctx.client.get(
          `/projects/${encodeURIComponent(String(project_id))}/versions.json`,
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
  reg("redmine_versions_list");

  server.registerTool(
    "redmine_version_get",
    {
      description: "Get version (GET /versions/:id.json).",
      inputSchema: z.object({ id: z.coerce.number().int().positive() }),
    },
    async ({ id }) => {
      try {
        const data = await ctx.client.get(`/versions/${id}.json`);
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_version_get");

  server.registerTool(
    "redmine_version_create",
    {
      description: "Create version (POST /projects/:project_id/versions.json).",
      inputSchema: z.object({
        project_id: idOrIdentifier("project id or identifier"),
        version: z.record(z.unknown()),
      }),
    },
    async ({ project_id, version }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.post(
          `/projects/${encodeURIComponent(String(project_id))}/versions.json`,
          { version },
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
  reg("redmine_version_create");

  server.registerTool(
    "redmine_version_update",
    {
      description: "Update version (PUT /versions/:id.json).",
      inputSchema: z.object({
        id: z.coerce.number().int().positive(),
        version: z.record(z.unknown()),
      }),
    },
    async ({ id, version }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.put(`/versions/${id}.json`, { version });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_version_update");

  server.registerTool(
    "redmine_version_delete",
    {
      description: "Delete version (DELETE /versions/:id.json). Requires confirm: true.",
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
        await ctx.client.delete(`/versions/${id}.json`);
        return toolJson({ ok: true, deleted_id: id });
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_version_delete");

  // --- Issue categories ---
  server.registerTool(
    "redmine_issue_categories_list",
    {
      description: "List issue categories for a project (GET /projects/:id/issue_categories.json).",
      inputSchema: z.object({ project_id: idOrIdentifier("project id or identifier") }),
    },
    async ({ project_id }) => {
      try {
        const data = await ctx.client.get(
          `/projects/${encodeURIComponent(String(project_id))}/issue_categories.json`,
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
  reg("redmine_issue_categories_list");

  server.registerTool(
    "redmine_issue_category_get",
    {
      description: "Get issue category (GET /issue_categories/:id.json).",
      inputSchema: z.object({ id: z.coerce.number().int().positive() }),
    },
    async ({ id }) => {
      try {
        const data = await ctx.client.get(`/issue_categories/${id}.json`);
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_issue_category_get");

  server.registerTool(
    "redmine_issue_category_create",
    {
      description: "Create issue category (POST /projects/:project_id/issue_categories.json).",
      inputSchema: z.object({
        project_id: idOrIdentifier("project id or identifier"),
        issue_category: z.record(z.unknown()),
      }),
    },
    async ({ project_id, issue_category }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.post(
          `/projects/${encodeURIComponent(String(project_id))}/issue_categories.json`,
          { issue_category },
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
  reg("redmine_issue_category_create");

  server.registerTool(
    "redmine_issue_category_update",
    {
      description: "Update issue category (PUT /issue_categories/:id.json).",
      inputSchema: z.object({
        id: z.coerce.number().int().positive(),
        issue_category: z.record(z.unknown()),
      }),
    },
    async ({ id, issue_category }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.put(`/issue_categories/${id}.json`, { issue_category });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_issue_category_update");

  server.registerTool(
    "redmine_issue_category_delete",
    {
      description: "Delete issue category (DELETE /issue_categories/:id.json). Requires confirm: true.",
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
        await ctx.client.delete(`/issue_categories/${id}.json`);
        return toolJson({ ok: true, deleted_id: id });
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_issue_category_delete");

  // --- Queries ---
  server.registerTool(
    "redmine_queries_list",
    {
      description: "List saved queries visible to the user (GET /queries.json).",
      inputSchema: z.object({
        ...paginationSchema,
      }),
    },
    async (input) => {
      try {
        const data = await ctx.client.get("/queries.json", {
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
  reg("redmine_queries_list");

  // --- Enumerations ---
  server.registerTool(
    "redmine_enumerations_list",
    {
      description:
        "List enumeration values (GET /enumerations/:type.json) e.g. issue_priorities, time_entry_activities, document_categories.",
      inputSchema: z.object({
        type: z
          .string()
          .min(1)
          .describe("Enumeration type slug, e.g. issue_priorities, time_entry_activities"),
      }),
    },
    async ({ type }) => {
      try {
        const data = await ctx.client.get(`/enumerations/${encodeURIComponent(type)}.json`);
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_enumerations_list");

  // --- Trackers (read-only) ---
  server.registerTool(
    "redmine_trackers_list",
    {
      description: "List trackers (GET /trackers.json).",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const data = await ctx.client.get("/trackers.json");
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_trackers_list");

  // --- Issue statuses (read-only) ---
  server.registerTool(
    "redmine_issue_statuses_list",
    {
      description: "List issue statuses (GET /issue_statuses.json).",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const data = await ctx.client.get("/issue_statuses.json");
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_issue_statuses_list");

  // --- Roles (read-only) ---
  server.registerTool(
    "redmine_roles_list",
    {
      description: "List roles (GET /roles.json).",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const data = await ctx.client.get("/roles.json");
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_roles_list");

  server.registerTool(
    "redmine_role_get",
    {
      description: "Get role (GET /roles/:id.json).",
      inputSchema: z.object({ id: z.coerce.number().int().positive() }),
    },
    async ({ id }) => {
      try {
        const data = await ctx.client.get(`/roles/${id}.json`);
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_role_get");

  // --- Custom fields (read-only index) ---
  server.registerTool(
    "redmine_custom_fields_list",
    {
      description: "List custom fields (GET /custom_fields.json).",
      inputSchema: z.object({ type: z.string().optional() }),
    },
    async ({ type }) => {
      try {
        const data = await ctx.client.get("/custom_fields.json", { type });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_custom_fields_list");

  return names;
}
