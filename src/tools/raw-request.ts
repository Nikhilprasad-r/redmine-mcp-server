import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import type { HttpMethod } from "../redmine/client.js";
import { assertConfirmed, assertRawRequestAllowed, assertWritable } from "../util/safety.js";
import { toolJson, toolRedmineError } from "../util/result.js";
import { destructiveTool, readTool, writeTool, type ToolMeta } from "../util/annotations.js";

const API_DOCS = "Redmine REST API, see https://www.redmine.org/projects/redmine/wiki/Rest_api";

const pathSchema = z
  .string()
  .min(1)
  .describe("Redmine REST path, must start with / e.g. /issues.json");
const querySchema = z.record(z.unknown()).optional();
const bodySchema = z.unknown().optional();

type RawRequestInput = {
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  confirm?: true;
};

/**
 * Escape-hatch tools for Redmine REST endpoints without a dedicated tool.
 * Split per HTTP method so read and write calls never share a tool (and annotations stay accurate).
 */
export function registerRawRequestTools(server: McpServer, ctx: AppContext): string[] {
  const names: string[] = [];

  const register = (
    name: string,
    method: HttpMethod,
    meta: ToolMeta,
    description: string,
    inputSchema: z.ZodObject<z.ZodRawShape>,
  ) => {
    server.registerTool(
      name,
      { ...meta, description, inputSchema },
      async (args) => {
        const input = args as RawRequestInput;
        const a = assertRawRequestAllowed(ctx.config);
        if (a) return a;
        if (!input.path.startsWith("/")) {
          return toolJson({ error: "path must start with /" }, true);
        }
        if (method !== "GET") {
          const w = assertWritable(ctx.config);
          if (w) return w;
        }
        if (method === "DELETE") {
          const c = assertConfirmed(input.confirm);
          if (c) return c;
        }
        try {
          const data = await ctx.client.request(method, input.path, {
            query: input.query,
            body: input.body,
          });
          return toolJson(data);
        } catch (e) {
          return toolRedmineError(e);
        }
      },
    );
    names.push(name);
  };

  register(
    "redmine_request_get",
    "GET",
    readTool("Raw Redmine GET request"),
    `Read any endpoint of the ${API_DOCS}. Use only when no dedicated redmine_* tool covers the endpoint. Disabled unless REDMINE_ALLOW_RAW_REQUEST=true.`,
    z.object({ path: pathSchema, query: querySchema }),
  );

  register(
    "redmine_request_post",
    "POST",
    writeTool("Raw Redmine POST request"),
    `Create a resource via POST on any endpoint of the ${API_DOCS}. Use only when no dedicated redmine_* tool covers the endpoint. Disabled unless REDMINE_ALLOW_RAW_REQUEST=true.`,
    z.object({ path: pathSchema, query: querySchema, body: bodySchema }),
  );

  register(
    "redmine_request_put",
    "PUT",
    destructiveTool("Raw Redmine PUT request"),
    `Update a resource via PUT on any endpoint of the ${API_DOCS}. Use only when no dedicated redmine_* tool covers the endpoint. Disabled unless REDMINE_ALLOW_RAW_REQUEST=true.`,
    z.object({ path: pathSchema, query: querySchema, body: bodySchema }),
  );

  register(
    "redmine_request_delete",
    "DELETE",
    destructiveTool("Raw Redmine DELETE request"),
    `Delete a resource via DELETE on any endpoint of the ${API_DOCS}. Requires confirm: true. Disabled unless REDMINE_ALLOW_RAW_REQUEST=true.`,
    z.object({ path: pathSchema, query: querySchema, confirm: z.literal(true).optional() }),
  );

  return names;
}
