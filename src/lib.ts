/**
 * Library entry point (`import { createRedmineServer } from "redmine-mcp-connector"`).
 * The CLI lives in index.ts; importing this module has no side effects.
 */
export {
  createRedmineServer,
  DEFAULT_INSTRUCTIONS,
  type CreateRedmineServerOptions,
  type RedmineServer,
} from "./server.js";
export { createConfig, loadConfig, normalizeBaseUrl, type AppConfig, type ConfigOptions } from "./config.js";
export type { AppContext } from "./context.js";
export {
  RedmineClient,
  RedmineHttpError,
  type BinaryDownload,
  type HttpMethod,
  type RedmineClientOptions,
} from "./redmine/client.js";
export { MAX_TOOL_TEXT_CHARS } from "./util/result.js";
