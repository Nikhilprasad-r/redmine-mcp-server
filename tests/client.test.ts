import "./setup.js";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { loadConfig } from "../src/config.js";
import { RedmineClient, RedmineHttpError } from "../src/redmine/client.js";

describe("RedmineClient", () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });
  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it("GET parses JSON", async () => {
    nock("http://redmine.test")
      .get("/issues.json")
      .query(true)
      .reply(200, { issues: [{ id: 1 }], total_count: 1 });

    const client = new RedmineClient(loadConfig());
    const data = (await client.get("/issues.json")) as { issues: { id: number }[] };
    expect(data.issues[0].id).toBe(1);
  });

  it("maps errors to RedmineHttpError", async () => {
    nock("http://redmine.test").get("/issues.json").query(true).reply(422, { errors: ["Subject cannot be blank"] });

    const client = new RedmineClient(loadConfig());
    await expect(client.get("/issues.json")).rejects.toMatchObject({
      name: "RedmineHttpError",
      status: 422,
    });
  });

  it("RedmineHttpError message includes errors array", async () => {
    nock("http://redmine.test").get("/issues.json").reply(403, { errors: ["Not authorized"] });
    const client = new RedmineClient(loadConfig());
    try {
      await client.get("/issues.json");
      expect.fail("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(RedmineHttpError);
      expect((e as RedmineHttpError).message).toContain("Not authorized");
    }
  });
});
