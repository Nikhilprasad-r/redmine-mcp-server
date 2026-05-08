import "./setup.js";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { loadConfig } from "../src/config.js";
import { RedmineClient } from "../src/redmine/client.js";
import { fetchAllRedmineList } from "../src/redmine/pagination.js";

describe("issues list + pagination", () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });
  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it("fetchAllRedmineList merges pages", async () => {
    nock("http://redmine.test")
      .get("/issues.json")
      .query((q) => String(q.offset) === "0")
      .reply(200, { issues: [{ id: 1 }], total_count: 150, limit: 100, offset: 0 });
    nock("http://redmine.test")
      .get("/issues.json")
      .query((q) => String(q.offset) === "100")
      .reply(200, { issues: [{ id: 2 }], total_count: 150, limit: 100, offset: 100 });

    const client = new RedmineClient(loadConfig());
    const { items, total_count } = await fetchAllRedmineList<{ id: number }>(
      client,
      "/issues.json",
      {},
      "issues",
      20,
      100,
    );
    expect(total_count).toBe(150);
    expect(items.map((i) => i.id).sort()).toEqual([1, 2]);
  });
});
