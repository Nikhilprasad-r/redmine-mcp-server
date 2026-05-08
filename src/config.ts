import { z } from "zod";

const envSchema = z.object({
  REDMINE_BASE_URL: z.string().url(),
  REDMINE_API_KEY: z.string().min(1),
  REDMINE_IMPERSONATE_USER: z.string().optional(),
  REDMINE_READONLY: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  REDMINE_ALLOW_RAW_REQUEST: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  REDMINE_HTTP_TIMEOUT_MS: z.coerce.number().min(1000).default(15_000),
  REDMINE_MAX_PAGES: z.coerce.number().min(1).max(500).default(20),
  REDMINE_MAX_DOWNLOAD_BYTES: z.coerce.number().min(1024).default(5 * 1024 * 1024),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse({
    REDMINE_BASE_URL: env.REDMINE_BASE_URL,
    REDMINE_API_KEY: env.REDMINE_API_KEY,
    REDMINE_IMPERSONATE_USER: env.REDMINE_IMPERSONATE_USER,
    REDMINE_READONLY: env.REDMINE_READONLY,
    REDMINE_ALLOW_RAW_REQUEST: env.REDMINE_ALLOW_RAW_REQUEST,
    REDMINE_HTTP_TIMEOUT_MS: env.REDMINE_HTTP_TIMEOUT_MS,
    REDMINE_MAX_PAGES: env.REDMINE_MAX_PAGES,
    REDMINE_MAX_DOWNLOAD_BYTES: env.REDMINE_MAX_DOWNLOAD_BYTES,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid configuration: ${msg}`);
  }
  return parsed.data;
}

export function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}
