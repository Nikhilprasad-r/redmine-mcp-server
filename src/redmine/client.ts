import { Buffer } from "node:buffer";
import type { AppConfig } from "../config.js";
import { normalizeBaseUrl } from "../config.js";
import type { RedmineErrorsBody } from "./types.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  /** When true, only JSON responses are parsed; otherwise returns Buffer */
  binaryResponse?: boolean;
};

export class RedmineHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly path: string,
    readonly body?: RedmineErrorsBody | unknown,
  ) {
    super(message);
    this.name = "RedmineHttpError";
  }
}

function buildQuery(query?: Record<string, unknown>): string {
  if (!query) return "";
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      sp.set(key, value.map(String).join(","));
    } else if (typeof value === "boolean") {
      if (value) sp.set(key, "true");
    } else {
      sp.set(key, String(value));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class RedmineClient {
  readonly baseUrl: string;
  private readonly base: string;
  private readonly apiKey: string;
  private readonly impersonate?: string;
  private readonly timeoutMs: number;

  constructor(config: AppConfig) {
    this.base = normalizeBaseUrl(config.REDMINE_BASE_URL);
    this.baseUrl = this.base;
    this.apiKey = config.REDMINE_API_KEY;
    this.impersonate = config.REDMINE_IMPERSONATE_USER;
    this.timeoutMs = config.REDMINE_HTTP_TIMEOUT_MS;
  }

  private headers(extra?: Record<string, string>, contentTypeJson = true): Headers {
    const h = new Headers(extra);
    h.set("X-Redmine-API-Key", this.apiKey);
    if (this.impersonate) h.set("X-Redmine-Switch-User", this.impersonate);
    if (contentTypeJson && !h.has("Content-Type")) h.set("Content-Type", "application/json");
    return h;
  }

  async request<T = unknown>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<T | Buffer> {
    const url = `${this.base}${path.startsWith("/") ? path : `/${path}`}${buildQuery(options.query)}`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), this.timeoutMs);
    let attempt = 0;
    const maxAttempts = method === "GET" ? 4 : 1;

    try {
      while (true) {
        attempt++;
        const init: RequestInit = {
          method,
          headers: this.headers(options.headers, !options.binaryResponse && !!options.body),
          signal: controller.signal,
        };
        if (options.body !== undefined) {
          if (options.binaryResponse) {
            init.body = options.body as BodyInit;
          } else {
            init.body = JSON.stringify(options.body);
          }
        }
        const res = await fetch(url, init);
        if (
          method === "GET" &&
          attempt < maxAttempts &&
          (res.status === 429 || (res.status >= 500 && res.status < 600))
        ) {
          await sleep(200 * 2 ** (attempt - 1));
          continue;
        }
        if (!res.ok) {
          let parsed: unknown;
          const text = await res.text();
          try {
            parsed = text ? JSON.parse(text) : undefined;
          } catch {
            parsed = text;
          }
          const errors = (parsed as RedmineErrorsBody)?.errors;
          const msg =
            Array.isArray(errors) && errors.length
              ? `${res.status}: ${errors.join("; ")}`
              : `${res.status} ${res.statusText} for ${method} ${path}`;
          throw new RedmineHttpError(msg, res.status, path, parsed);
        }
        if (options.binaryResponse) {
          const buf = Buffer.from(await res.arrayBuffer());
          return buf as Buffer & T;
        }
        const ct = res.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) {
          const text = await res.text();
          return text as unknown as T;
        }
        const json = (await res.json()) as T;
        return json;
      }
    } catch (e) {
      if (e instanceof RedmineHttpError) throw e;
      if (e instanceof Error && e.name === "AbortError") {
        throw new RedmineHttpError(`Request timeout after ${this.timeoutMs}ms`, 0, path);
      }
      throw e;
    } finally {
      clearTimeout(t);
    }
  }

  get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    return this.request<T>("GET", path, { query }) as Promise<T>;
  }

  post<T>(path: string, body?: unknown, query?: Record<string, unknown>): Promise<T> {
    return this.request<T>("POST", path, { body, query }) as Promise<T>;
  }

  put<T>(path: string, body?: unknown, query?: Record<string, unknown>): Promise<T> {
    return this.request<T>("PUT", path, { body, query }) as Promise<T>;
  }

  patch<T>(path: string, body?: unknown, query?: Record<string, unknown>): Promise<T> {
    return this.request<T>("PATCH", path, { body, query }) as Promise<T>;
  }

  delete<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    return this.request<T>("DELETE", path, { query }) as Promise<T>;
  }

  /** POST /uploads.json — body is raw file bytes, Content-Type application/octet-stream */
  async uploadFile(filename: string, data: Uint8Array): Promise<{ upload: { token: string } }> {
    const path = `/uploads.json${buildQuery({ filename })}`;
    const url = `${this.base}${path}`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const h = this.headers({ "Content-Type": "application/octet-stream" }, false);
      const res = await fetch(url, {
        method: "POST",
        headers: h,
        body: Buffer.from(data),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new RedmineHttpError(`${res.status} ${text}`, res.status, path);
      }
      return (await res.json()) as { upload: { token: string } };
    } finally {
      clearTimeout(t);
    }
  }
}
