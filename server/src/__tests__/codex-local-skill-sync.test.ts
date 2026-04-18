import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listCodexSkills,
  syncCodexSkills,
} from "@proactiva/adapter-codex-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("codex local skill sync", () => {
  const proactivaKey = "proactiva/proactiva/proactiva";
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("reports configured Proactiva skills for workspace injection on the next run", async () => {
    const codexHome = await makeTempDir("proactiva-codex-skill-sync-");
    cleanupDirs.add(codexHome);

    const ctx = {
      agentId: "agent-1",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        proactivaSkillSync: {
          desiredSkills: [proactivaKey],
        },
      },
    } as const;

    const before = await listCodexSkills(ctx);
    expect(before.mode).toBe("ephemeral");
    expect(before.desiredSkills).toContain(proactivaKey);
    expect(before.entries.find((entry) => entry.key === proactivaKey)?.required).toBe(true);
    expect(before.entries.find((entry) => entry.key === proactivaKey)?.state).toBe("configured");
    expect(before.entries.find((entry) => entry.key === proactivaKey)?.detail).toContain("CODEX_HOME/skills/");
  });

  it("does not persist Proactiva skills into CODEX_HOME during sync", async () => {
    const codexHome = await makeTempDir("proactiva-codex-skill-prune-");
    cleanupDirs.add(codexHome);

    const configuredCtx = {
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        proactivaSkillSync: {
          desiredSkills: [proactivaKey],
        },
      },
    } as const;

    const after = await syncCodexSkills(configuredCtx, [proactivaKey]);
    expect(after.mode).toBe("ephemeral");
    expect(after.entries.find((entry) => entry.key === proactivaKey)?.state).toBe("configured");
    await expect(fs.lstat(path.join(codexHome, "skills", "proactiva"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("keeps required bundled Proactiva skills configured even when the desired set is emptied", async () => {
    const codexHome = await makeTempDir("proactiva-codex-skill-required-");
    cleanupDirs.add(codexHome);

    const configuredCtx = {
      agentId: "agent-2",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        proactivaSkillSync: {
          desiredSkills: [],
        },
      },
    } as const;

    const after = await syncCodexSkills(configuredCtx, []);
    expect(after.desiredSkills).toContain(proactivaKey);
    expect(after.entries.find((entry) => entry.key === proactivaKey)?.state).toBe("configured");
  });

  it("normalizes legacy flat Proactiva skill refs before reporting configured state", async () => {
    const codexHome = await makeTempDir("proactiva-codex-legacy-skill-sync-");
    cleanupDirs.add(codexHome);

    const snapshot = await listCodexSkills({
      agentId: "agent-3",
      companyId: "company-1",
      adapterType: "codex_local",
      config: {
        env: {
          CODEX_HOME: codexHome,
        },
        proactivaSkillSync: {
          desiredSkills: ["proactiva"],
        },
      },
    });

    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.desiredSkills).toContain(proactivaKey);
    expect(snapshot.desiredSkills).not.toContain("proactiva");
    expect(snapshot.entries.find((entry) => entry.key === proactivaKey)?.state).toBe("configured");
    expect(snapshot.entries.find((entry) => entry.key === "proactiva")).toBeUndefined();
  });
});
