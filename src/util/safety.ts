import type { AppConfig } from "../config.js";
import { toolError } from "./result.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export function assertWritable(config: AppConfig): CallToolResult | null {
  if (config.REDMINE_READONLY) {
    return toolError("Mutating operation blocked: REDMINE_READONLY is enabled.");
  }
  return null;
}

export function assertRawRequestAllowed(config: AppConfig): CallToolResult | null {
  if (!config.REDMINE_ALLOW_RAW_REQUEST) {
    return toolError("redmine_request is disabled. Set REDMINE_ALLOW_RAW_REQUEST=true to enable.");
  }
  return null;
}

export function assertConfirmed(confirm: boolean | undefined): CallToolResult | null {
  if (confirm !== true) {
    return toolError('This destructive action requires confirm: true in the tool arguments.');
  }
  return null;
}
