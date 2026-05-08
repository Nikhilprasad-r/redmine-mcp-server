import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "./context.js";
import { RedmineHttpError } from "./redmine/client.js";

function jsonResource(uri: string, data: unknown) {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function registerResources(server: McpServer, ctx: AppContext): void {
  server.registerResource(
    "redmine-projects",
    "redmine://projects",
    {
      title: "Projects",
      description: "Projects visible to the API user (first page, limit 100).",
      mimeType: "application/json",
    },
    async (uri) => {
      try {
        const data = await ctx.client.get("/projects.json", { limit: 100, offset: 0 });
        return jsonResource(uri.href, data);
      } catch (e) {
        const msg = e instanceof RedmineHttpError ? e.message : String(e);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `Error: ${msg}`,
            },
          ],
        };
      }
    },
  );

  server.registerResource(
    "redmine-me",
    "redmine://me",
    {
      title: "Current user",
      description: "GET /users/current.json",
      mimeType: "application/json",
    },
    async (uri) => {
      try {
        const data = await ctx.client.get("/users/current.json");
        return jsonResource(uri.href, data);
      } catch (e) {
        const msg = e instanceof RedmineHttpError ? e.message : String(e);
        return {
          contents: [{ uri: uri.href, mimeType: "text/plain", text: `Error: ${msg}` }],
        };
      }
    },
  );

  server.registerResource(
    "redmine-me-issues",
    "redmine://me/issues",
    {
      title: "My issues",
      description: "Issues assigned to the API user (limit 100).",
      mimeType: "application/json",
    },
    async (uri) => {
      try {
        const data = await ctx.client.get("/issues.json", {
          assigned_to_id: "me",
          limit: 100,
          offset: 0,
        });
        return jsonResource(uri.href, data);
      } catch (e) {
        const msg = e instanceof RedmineHttpError ? e.message : String(e);
        return {
          contents: [{ uri: uri.href, mimeType: "text/plain", text: `Error: ${msg}` }],
        };
      }
    },
  );

  const projectTemplate = new ResourceTemplate("redmine://projects/{id}", {
    list: undefined,
  });

  server.registerResource(
    "redmine-project",
    projectTemplate,
    {
      title: "Project by id",
      description: "GET /projects/:id.json",
      mimeType: "application/json",
    },
    async (uri, variables) => {
      const rawId = variables.id;
      const id = Array.isArray(rawId) ? rawId[0] : rawId;
      if (id === undefined || id === null || id === "") {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: "Missing template variable id",
            },
          ],
        };
      }
      try {
        const data = await ctx.client.get(`/projects/${encodeURIComponent(String(id))}.json`);
        return jsonResource(uri.href, data);
      } catch (e) {
        const msg = e instanceof RedmineHttpError ? e.message : String(e);
        return {
          contents: [{ uri: uri.href, mimeType: "text/plain", text: `Error: ${msg}` }],
        };
      }
    },
  );
}
