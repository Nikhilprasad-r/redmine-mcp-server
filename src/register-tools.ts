import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppContext } from "./context.js";
import { registerAttachmentsSearchReposTools } from "./tools/attachments-search-repos.js";
import { registerGroupTools } from "./tools/groups.js";
import { registerIssueTools } from "./tools/issues.js";
import { registerMembershipTools } from "./tools/memberships.js";
import { registerNewsTools } from "./tools/news.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerRawRequestTool } from "./tools/raw-request.js";
import { registerTimeEntryTools } from "./tools/time-entries.js";
import { registerUserTools } from "./tools/users.js";
import { registerVersionsCategoriesQueriesTools } from "./tools/versions-categories-queries.js";
import { registerWikiTools } from "./tools/wiki.js";

export function registerAllTools(server: McpServer, ctx: AppContext): string[] {
  const names: string[] = [];
  names.push(...registerIssueTools(server, ctx));
  names.push(...registerProjectTools(server, ctx));
  names.push(...registerUserTools(server, ctx));
  names.push(...registerTimeEntryTools(server, ctx));
  names.push(...registerNewsTools(server, ctx));
  names.push(...registerWikiTools(server, ctx));
  names.push(...registerVersionsCategoriesQueriesTools(server, ctx));
  names.push(...registerGroupTools(server, ctx));
  names.push(...registerMembershipTools(server, ctx));
  names.push(...registerAttachmentsSearchReposTools(server, ctx));
  if (ctx.config.REDMINE_ALLOW_RAW_REQUEST) {
    names.push(...registerRawRequestTool(server, ctx));
  }
  return names;
}
