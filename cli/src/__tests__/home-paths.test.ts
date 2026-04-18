import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  describeLocalInstancePaths,
  expandHomePrefix,
  resolveProactivaHomeDir,
  resolveProactivaInstanceId,
} from "../config/home.js";

const ORIGINAL_ENV = { ...process.env };

describe("home path resolution", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("defaults to ~/.proactiva and default instance", () => {
    delete process.env.PROACTIVA_HOME;
    delete process.env.PROACTIVA_INSTANCE_ID;

    const paths = describeLocalInstancePaths();
    expect(paths.homeDir).toBe(path.resolve(os.homedir(), ".proactiva"));
    expect(paths.instanceId).toBe("default");
    expect(paths.configPath).toBe(path.resolve(os.homedir(), ".proactiva", "instances", "default", "config.json"));
  });

  it("supports PROACTIVA_HOME and explicit instance ids", () => {
    process.env.PROACTIVA_HOME = "~/proactiva-home";

    const home = resolveProactivaHomeDir();
    expect(home).toBe(path.resolve(os.homedir(), "proactiva-home"));
    expect(resolveProactivaInstanceId("dev_1")).toBe("dev_1");
  });

  it("rejects invalid instance ids", () => {
    expect(() => resolveProactivaInstanceId("bad/id")).toThrow(/Invalid instance id/);
  });

  it("expands ~ prefixes", () => {
    expect(expandHomePrefix("~")).toBe(os.homedir());
    expect(expandHomePrefix("~/x/y")).toBe(path.resolve(os.homedir(), "x/y"));
  });
});
