import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/config.js";
import { RedmineClient } from "../src/redmine/client.js";

const integrationEnabled =
  Boolean(process.env.REDMINE_INTEGRATION_URL) && Boolean(process.env.REDMINE_INTEGRATION_API_KEY);

describe("integration (optional)", () => {
  (integrationEnabled ? it : it.skip)("lists issues from real Redmine", async () => {
    process.env.REDMINE_BASE_URL = process.env.REDMINE_INTEGRATION_URL!;
    process.env.REDMINE_API_KEY = process.env.REDMINE_INTEGRATION_API_KEY!;
    const client = new RedmineClient(loadConfig());
    const data = (await client.get("/issues.json", { limit: 1 })) as { issues: unknown[] };
    expect(Array.isArray(data.issues)).toBe(true);
  });
});
