import "./setup.js";
import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/config.js";
import { assertWritable, assertConfirmed } from "../src/util/safety.js";

describe("safety helpers", () => {
  it("assertWritable blocks when REDMINE_READONLY", () => {
    process.env.REDMINE_READONLY = "true";
    const cfg = loadConfig();
    const r = assertWritable(cfg);
    expect(r).not.toBeNull();
    expect(r?.isError).toBe(true);
    delete process.env.REDMINE_READONLY;
  });

  it("assertConfirmed requires true", () => {
    expect(assertConfirmed(undefined)).not.toBeNull();
    expect(assertConfirmed(true)).toBeNull();
  });
});
