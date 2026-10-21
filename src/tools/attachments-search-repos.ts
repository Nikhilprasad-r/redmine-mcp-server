import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { confirmDestructiveSchema, idOrIdentifier } from "../util/schemas.js";
import { assertConfirmed, assertWritable } from "../util/safety.js";
import { toolJson, toolRedmineError } from "../util/result.js";
import { destructiveTool, readTool, writeTool } from "../util/annotations.js";

export function registerAttachmentsSearchReposTools(
  server: McpServer,
  ctx: AppContext,
): string[] {
  const names: string[] = [];
  const reg = (n: string) => names.push(n);

  server.registerTool(
    "redmine_search",
    {
      ...readTool("Search Redmine"),
      description: "Search Redmine (GET /search.json).",
      inputSchema: z.object({
        q: z.string().min(1),
        scope: z
          .union([
            z.enum(["all", "issues", "news", "documents", "changesets", "wiki_pages", "messages", "projects"]),
            z.string(),
          ])
          .optional(),
        project_id: idOrIdentifier("limit to project").optional(),
        offset: z.coerce.number().min(0).optional(),
        limit: z.coerce.number().min(1).max(100).optional(),
      }),
    },
    async (input) => {
      try {
        const data = await ctx.client.get("/search.json", {
          q: input.q,
          scope: input.scope,
          project_id: input.project_id,
          offset: input.offset,
          limit: input.limit,
        });
        return toolJson(data);
      } catch (e) {
        return toolRedmineError(e);
      }
    },
  );
  reg("redmine_search");

  server.registerTool(
    "redmine_attachment_get",
    {
      ...readTool("Get attachment details"),
      description: "Get attachment metadata (GET /attachments/:id.json).",
      inputSchema: z.object({ id: z.coerce.number().int().positive() }),
    },
    async ({ id }) => {
      try {
        const data = await ctx.client.get(`/attachments/${id}.json`);
        return toolJson(data);
      } catch (e) {
        return toolRedmineError(e);
      }
    },
  );
  reg("redmine_attachment_get");

  server.registerTool(
    "redmine_attachment_update",
    {
      ...destructiveTool("Update attachment details"),
      description: "Update attachment metadata (PUT /attachments/:id.json).",
      inputSchema: z.object({
        id: z.coerce.number().int().positive(),
        attachment: z.record(z.unknown()),
      }),
    },
    async ({ id, attachment }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const data = await ctx.client.put(`/attachments/${id}.json`, { attachment });
        return toolJson(data);
      } catch (e) {
        return toolRedmineError(e);
      }
    },
  );
  reg("redmine_attachment_update");

  server.registerTool(
    "redmine_attachment_delete",
    {
      ...destructiveTool("Delete attachment"),
      description: "Delete attachment (DELETE /attachments/:id.json). Requires confirm: true.",
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
        await ctx.client.delete(`/attachments/${id}.json`);
        return toolJson({ ok: true, deleted_id: id });
      } catch (e) {
        return toolRedmineError(e);
      }
    },
  );
  reg("redmine_attachment_delete");

  server.registerTool(
    "redmine_attachment_upload",
    {
      ...writeTool("Upload attachment"),
      description:
        "Upload a file to Redmine (POST /uploads.json). Returns upload token; attach via issue/wiki update using uploads array.",
      inputSchema: z.object({
        filename: z.string().min(1),
        /** Base64-encoded file contents */
        content_base64: z.string().min(1),
      }),
    },
    async ({ filename, content_base64 }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const buf = Buffer.from(content_base64, "base64");
        const data = await ctx.client.uploadFile(filename, buf);
        return toolJson(data);
      } catch (e) {
        return toolRedmineError(e);
      }
    },
  );
  reg("redmine_attachment_upload");

  server.registerTool(
    "redmine_attachment_download",
    {
      ...readTool("Download attachment"),
      description:
        "Download attachment binary (GET /attachments/download/:id.json or .bin). Returns base64 and content_type; size capped by REDMINE_MAX_DOWNLOAD_BYTES.",
      inputSchema: z.object({
        id: z.coerce.number().int().positive(),
      }),
    },
    async ({ id }) => {
      try {
        const max = ctx.config.REDMINE_MAX_DOWNLOAD_BYTES;
        const result = await ctx.client.getBinary(`/attachments/download/${id}`, max);
        if (!result.ok) {
          return toolJson(
            {
              error: `Attachment size ${result.size} exceeds REDMINE_MAX_DOWNLOAD_BYTES (${max})`,
              hint: "Use redmine_attachment_get for the content_url and open it outside the conversation.",
            },
            true,
          );
        }
        // Already capped by REDMINE_MAX_DOWNLOAD_BYTES; truncating base64 would corrupt the file.
        return toolJson(
          {
            id,
            content_type: result.contentType,
            size: result.data.length,
            content_base64: result.data.toString("base64"),
          },
          false,
          Infinity,
        );
      } catch (e) {
        return toolRedmineError(e);
      }
    },
  );
  reg("redmine_attachment_download");

  // Repository: only API-supported issue linking on changesets
  server.registerTool(
    "redmine_repository_revision_link_issue",
    {
      ...writeTool("Link issue to revision"),
      description:
        "Link an issue to a repository changeset (POST /projects/:id/repository/:repository_id/revisions/:rev/issues.json). Requires API permission on repository.",
      inputSchema: z.object({
        project_id: idOrIdentifier("project id or identifier"),
        repository_id: z.string().min(1),
        rev: z.string().min(1),
        issue_id: z.coerce.number().int().positive(),
      }),
    },
    async ({ project_id, repository_id, rev, issue_id }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      try {
        const path = `/projects/${encodeURIComponent(String(project_id))}/repository/${encodeURIComponent(repository_id)}/revisions/${encodeURIComponent(rev)}/issues.json`;
        const data = await ctx.client.post(path, undefined, { issue_id });
        return toolJson(data);
      } catch (e) {
        return toolRedmineError(e);
      }
    },
  );
  reg("redmine_repository_revision_link_issue");

  server.registerTool(
    "redmine_repository_revision_unlink_issue",
    {
      ...destructiveTool("Unlink issue from revision"),
      description: "Unlink an issue from a changeset (DELETE .../revisions/:rev/issues/:issue_id.json). Requires confirm: true.",
      inputSchema: z.object({
        project_id: idOrIdentifier("project id or identifier"),
        repository_id: z.string().min(1),
        rev: z.string().min(1),
        issue_id: z.coerce.number().int().positive(),
        ...confirmDestructiveSchema,
      }),
    },
    async ({ project_id, repository_id, rev, issue_id, confirm }) => {
      const w = assertWritable(ctx.config);
      if (w) return w;
      const c = assertConfirmed(confirm);
      if (c) return c;
      try {
        const path = `/projects/${encodeURIComponent(String(project_id))}/repository/${encodeURIComponent(repository_id)}/revisions/${encodeURIComponent(rev)}/issues/${issue_id}.json`;
        await ctx.client.delete(path);
        return toolJson({ ok: true });
      } catch (e) {
        return toolRedmineError(e);
      }
    },
  );
  reg("redmine_repository_revision_unlink_issue");

  return names;
}
