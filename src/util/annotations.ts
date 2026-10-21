import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

/** Spread into a registerTool config: sets the display title and MCP tool annotations. */
export type ToolMeta = { title: string; annotations: ToolAnnotations };

function meta(title: string, hints: Omit<ToolAnnotations, "title">): ToolMeta {
  return { title, annotations: { title, openWorldHint: true, ...hints } };
}

/** GET-only tools. */
export function readTool(title: string): ToolMeta {
  return meta(title, { readOnlyHint: true });
}

/** Tools that add data without overwriting or removing anything (POST). */
export function writeTool(title: string): ToolMeta {
  return meta(title, { readOnlyHint: false, destructiveHint: false, idempotentHint: false });
}

/** Tools that overwrite, archive, unlink or delete existing data (PUT/DELETE). */
export function destructiveTool(title: string): ToolMeta {
  return meta(title, { readOnlyHint: false, destructiveHint: true, idempotentHint: true });
}
