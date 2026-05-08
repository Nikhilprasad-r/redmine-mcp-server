import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { RedmineHttpError } from "../redmine/client.js";
import { fetchAllRedmineList } from "../redmine/pagination.js";
import { confirmDestructiveSchema, idOrIdentifier, paginationSchema } from "../util/schemas.js";
import { assertConfirmed, assertWritable } from "../util/safety.js";
import { toolJson } from "../util/result.js";

const includeIssue = z.enum([
  "children",
  "attachments",
  "relations",
  "changesets",
  "journals",
  "watchers",
  "allowed_statuses",
]);

export function registerIssueTools(server: McpServer, ctx: AppContext): string[] {
  const names: string[] = [];
  const reg = (n: string) => names.push(n);

  server.registerTool(
    "redmine_issues_list",
    {
      description:
        "List issues (GET /issues.json). Supports filters and optional fetch_all to merge pages.",
      inputSchema: z.object({
        ...paginationSchema,
        project_id: idOrIdentifier("project id or identifier").optional(),
        subproject_id: z.string().optional(),
        tracker_id: z.coerce.number().optional(),
        status_id: z.string().optional(),
        assigned_to_id: z.union([z.coerce.number(), z.literal("me"), z.string()]).optional(),
        author_id: z.coerce.number().optional(),
        category_id: z.coerce.number().optional(),
        fixed_version_id: z.coerce.number().optional(),
        subject: z.string().optional(),
        query_id: z.coerce.number().optional(),
        sort: z.string().optional(),
        include: z.array(includeIssue).optional(),
      }),
    },
    async (input) => {
      try {
        const q: Record<string, unknown> = {
          project_id: input.project_id,
          subproject_id: input.subproject_id,
          tracker_id: input.tracker_id,
          status_id: input.status_id,
          assigned_to_id: input.assigned_to_id,
          author_id: input.author_id,
          category_id: input.category_id,
          fixed_version_id: input.fixed_version_id,
          subject: input.subject,
          query_id: input.query_id,
          sort: input.sort,
          include: input.include,
        };
        if (input.fetch_all) {
          const { items, total_count } = await fetchAllRedmineList<unknown>(
            ctx.client,
            "/issues.json",
            q,
            "issues",
            ctx.config.REDMINE_MAX_PAGES,
          );
          return toolJson({ issues: items, total_count, fetched: items.length });
        }
        const data = await ctx.client.get("/issues.json", {
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
  reg("redmine_issues_list");

  server.registerTool(
    "redmine_issue_get",
    {
      description: "Get a single issue (GET /issues/:id.json).",
      inputSchema: z.object({
        id: z.coerce.number().int().positive(),
        include: z.array(includeIssue).optional(),
      }),
    },
    async ({ id, include }) => {
      try {
        const data = await ctx.client.get(`/issues/${id}.json`, { include });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_issue_get");

  server.registerTool(
    "redmine_issue_create",
    {
      description: "Create an issue (POST /issues.json). Body uses Redmine issue JSON shape.",
      inputSchema: z.object({
        issue: z.record(z.unknown()).describe("Issue attributes, e.g. { project_id, tracker_id, subject, description }"),
      }),
    },
    async ({ issue }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.post("/issues.json", { issue });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_issue_create");

  server.registerTool(
    "redmine_issue_update",
    {
      description:
        "Update an issue including notes/comments (PUT /issues/:id.json). Pass issue fields and optional notes.",
      inputSchema: z.object({
        id: z.coerce.number().int().positive(),
        issue: z.record(z.unknown()).describe("Fields to update, e.g. { status_id, done_ratio, notes: 'comment' }"),
      }),
    },
    async ({ id, issue }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.put(`/issues/${id}.json`, { issue });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_issue_update");

  server.registerTool(
    "redmine_issue_add_comment",
    {
      description: "Add a journal note to an issue (same as update with notes only).",
      inputSchema: z.object({
        id: z.coerce.number().int().positive(),
        notes: z.string().min(1),
        private_notes: z.boolean().optional(),
      }),
    },
    async ({ id, notes, private_notes }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const issue: Record<string, unknown> = { notes };
        if (private_notes !== undefined) issue.private_notes = private_notes;
        const data = await ctx.client.put(`/issues/${id}.json`, { issue });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_issue_add_comment");

  server.registerTool(
    "redmine_issue_delete",
    {
      description: "Delete an issue (DELETE /issues/:id.json). Requires confirm: true.",
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
        await ctx.client.delete(`/issues/${id}.json`);
        return toolJson({ ok: true, deleted_id: id });
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_issue_delete");

  server.registerTool(
    "redmine_issue_add_watcher",
    {
      description: "Add a watcher to an issue (POST /issues/:id/watchers.json).",
      inputSchema: z.object({
        issue_id: z.coerce.number().int().positive(),
        user_id: z.coerce.number().int().positive(),
      }),
    },
    async ({ issue_id, user_id }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.post(`/issues/${issue_id}/watchers.json`, { user_id });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_issue_add_watcher");

  server.registerTool(
    "redmine_issue_remove_watcher",
    {
      description: "Remove a watcher from an issue (DELETE /issues/:issue_id/watchers/:user_id.json).",
      inputSchema: z.object({
        issue_id: z.coerce.number().int().positive(),
        user_id: z.coerce.number().int().positive(),
      }),
    },
    async ({ issue_id, user_id }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        await ctx.client.delete(`/issues/${issue_id}/watchers/${user_id}.json`);
        return toolJson({ ok: true });
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_issue_remove_watcher");

  server.registerTool(
    "redmine_issue_relations_list",
    {
      description: "List relations for an issue (GET /issues/:id/relations.json).",
      inputSchema: z.object({ issue_id: z.coerce.number().int().positive() }),
    },
    async ({ issue_id }) => {
      try {
        const data = await ctx.client.get(`/issues/${issue_id}/relations.json`);
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_issue_relations_list");

  server.registerTool(
    "redmine_issue_add_relation",
    {
      description: "Add a relation between issues (POST /issues/:id/relations.json).",
      inputSchema: z.object({
        issue_id: z.coerce.number().int().positive(),
        relation: z
          .object({
            issue_to_id: z.coerce.number().int().positive(),
            relation_type: z.string(),
            delay: z.coerce.number().optional(),
          })
          .passthrough(),
      }),
    },
    async ({ issue_id, relation }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.post(`/issues/${issue_id}/relations.json`, { relation });
        return toolJson(data);
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_issue_add_relation");

  server.registerTool(
    "redmine_issue_remove_relation",
    {
      description: "Delete an issue relation (DELETE /relations/:id.json). Requires confirm: true.",
      inputSchema: z.object({
        relation_id: z.coerce.number().int().positive(),
        ...confirmDestructiveSchema,
      }),
    },
    async ({ relation_id, confirm }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      const c = assertConfirmed(confirm);
      if (c) return c;
      try {
        await ctx.client.delete(`/relations/${relation_id}.json`);
        return toolJson({ ok: true, deleted_relation_id: relation_id });
      } catch (e) {
        return toolJson(
          { error: e instanceof RedmineHttpError ? e.message : String(e) },
          true,
        );
      }
    },
  );
  reg("redmine_issue_remove_relation");

  return names;
}
