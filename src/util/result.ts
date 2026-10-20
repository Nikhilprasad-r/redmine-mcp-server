import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { RedmineHttpError } from "../redmine/client.js";

/** Upper bound on tool result text, so a fetch_all over a big project can't flood the conversation. */
export const MAX_TOOL_TEXT_CHARS = 100_000;

export function toolJson(
  data: unknown,
  isError = false,
  maxChars = MAX_TOOL_TEXT_CHARS,
): CallToolResult {
  let text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  if (text.length > maxChars) {
    const omitted = text.length - maxChars;
    text =
      `${text.slice(0, maxChars)}\n\n[Truncated: ${omitted} more characters omitted. ` +
      "Narrow the filters, lower limit, page with offset, or drop fetch_all.]";
  }
  return {
    content: [{ type: "text", text }],
    isError,
  };
}

export function toolError(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

function hintForStatus(status: number): string | undefined {
  if (status === 0) return "Redmine did not respond in time. Retry, or narrow the request.";
  if (status === 401) {
    return "Redmine rejected the API key. Check the key and that the REST API is enabled (Administration > Settings > API).";
  }
  if (status === 403) return "This Redmine user lacks permission for this action, or the module is disabled in the project.";
  if (status === 404) return "Not found, or not visible to this Redmine user. Check the id or identifier.";
  if (status === 422) return "Redmine rejected the input. Fix the fields named in the error and retry.";
  if (status === 429 || status >= 500) return "Redmine is overloaded or failing. Retry later.";
  return undefined;
}

/** Error result for a failed Redmine call, with a status-specific hint the model can act on. */
export function toolRedmineError(e: unknown): CallToolResult {
  if (e instanceof RedmineHttpError) {
    const hint = hintForStatus(e.status);
    return toolJson(
      { error: e.message, ...(e.status ? { status: e.status } : {}), ...(hint ? { hint } : {}) },
      true,
    );
  }
  const message = e instanceof Error ? e.message : String(e);
  return toolJson(
    { error: message, hint: "Could not reach Redmine. Check REDMINE_BASE_URL and network access." },
    true,
  );
}
