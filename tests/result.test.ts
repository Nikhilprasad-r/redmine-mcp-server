import { describe, it, expect } from "vitest";
import { RedmineHttpError } from "../src/redmine/client.js";
import { MAX_TOOL_TEXT_CHARS, toolJson, toolRedmineError } from "../src/util/result.js";

function textOf(r: ReturnType<typeof toolJson>): string {
  return (r.content[0] as { text: string }).text;
}

describe("toolJson", () => {
  it("truncates oversized results with an actionable notice", () => {
    const r = toolJson("x".repeat(MAX_TOOL_TEXT_CHARS + 500));
    const text = textOf(r);
    expect(text.startsWith("x".repeat(MAX_TOOL_TEXT_CHARS))).toBe(true);
    expect(text).toContain("[Truncated: 500 more characters omitted.");
    expect(r.isError).toBe(false);
  });

  it("leaves results under the cap untouched and honours a custom cap", () => {
    expect(textOf(toolJson("short"))).toBe("short");
    expect(textOf(toolJson("y".repeat(10), false, Infinity))).toBe("y".repeat(10));
  });
});

describe("toolRedmineError", () => {
  it.each([
    [401, "API key"],
    [403, "permission"],
    [404, "Not found"],
    [422, "rejected the input"],
    [503, "Retry later"],
  ])("adds a hint for HTTP %i", (status, hint) => {
    const r = toolRedmineError(new RedmineHttpError(`${status}: boom`, status, "/issues.json"));
    const body = JSON.parse(textOf(r));
    expect(r.isError).toBe(true);
    expect(body).toMatchObject({ error: `${status}: boom`, status });
    expect(body.hint).toContain(hint);
  });

  it("explains timeouts without a bogus status", () => {
    const body = JSON.parse(textOf(toolRedmineError(new RedmineHttpError("Request timeout after 15000ms", 0, "/x"))));
    expect(body.status).toBeUndefined();
    expect(body.hint).toContain("did not respond in time");
  });

  it("points at connectivity for non-HTTP failures", () => {
    const body = JSON.parse(textOf(toolRedmineError(new TypeError("fetch failed"))));
    expect(body).toMatchObject({ error: "fetch failed" });
    expect(body.hint).toContain("Could not reach Redmine");
  });
});
