import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppContext } from "../context.js";
import { RedmineHttpError, type HttpMethod } from "../redmine/client.js";
import { assertConfirmed, assertRawRequestAllowed, assertWritable } from "../util/safety.js";
import { toolJson } from "../util/result.js";

const methods = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);

export function registerRawRequestTool(server: McpServer, ctx: AppContext): string[] {
  server.registerTool(
    "redmine_request",
    {
      description:
        "Escape hatch: arbitrary Redmine REST call (disabled unless REDMINE_ALLOW_RAW_REQUEST=true). DELETE requires confirm: true.",
      inputSchema: z.object({
        method: methods,
        path: z
          .string()
          .min(1)
          .describe("Must start with / e.g. /issues.json"),
        query: z.record(z.unknown()).optional(),
        body: z.unknown().optional(),
        confirm: z.literal(true).optional(),
      }),
    },
    async (input) => {
      const a = assertRawRequestAllowed(ctx.config);
      if (a) return a;
      if (!input.path.startsWith("/")) {
        return toolJson({ error: "path must start with /" }, true);
      }
      const m = input.method as HttpMethod;
      if (m !== "GET") {
        const w = assertWritable(ctx.config);
        if (w) return w;
      }
      if (m === "DELETE") {
        const c = assertConfirmed(input.confirm);
        if (c) return c;
      }
      try {
        const data = await ctx.client.request(m, input.path, {
          query: input.query,
          body: input.body,
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

  return ["redmine_request"];
}
