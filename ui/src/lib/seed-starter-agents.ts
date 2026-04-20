import type { AgentRole } from "@proactiva/shared";
import { agentsApi } from "../api/agents";
import { getUIAdapter } from "../adapters";
import { defaultCreateValues } from "../components/agent-config-defaults";
import { buildNewAgentRuntimeConfig } from "./new-agent-runtime-config";

interface StarterAgent {
  name: string;
  role: AgentRole;
}

/**
 * Starter roster for a new consultant practice. Mirrors the core loop:
 * a CEO agent to orchestrate, an observer to read client workflow, and
 * an analyst to surface muddle. Consultants can edit/remove these after
 * the fact — the goal is to land on the Agents page with a usable team
 * instead of an empty state.
 */
const STARTER_AGENTS: StarterAgent[] = [
  { name: "CEO", role: "ceo" },
  { name: "Observer", role: "researcher" },
  { name: "Analyst", role: "general" },
];

export async function seedStarterAgents(companyId: string): Promise<number> {
  const adapter = getUIAdapter("claude_local");
  const adapterConfig = adapter.buildAdapterConfig({
    ...defaultCreateValues,
    adapterType: "claude_local",
    dangerouslySkipPermissions: true,
  });
  const runtimeConfig = buildNewAgentRuntimeConfig();

  const results = await Promise.allSettled(
    STARTER_AGENTS.map((seed) =>
      agentsApi.create(companyId, {
        name: seed.name,
        role: seed.role,
        adapterType: "claude_local",
        adapterConfig,
        runtimeConfig,
      }),
    ),
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    // Surface in the console but don't block the consultant — any that
    // succeeded are already useful and the rest can be added manually.
    for (const f of failures) {
      console.warn("[seed-starter-agents] failed:", (f as PromiseRejectedResult).reason);
    }
  }

  return results.filter((r) => r.status === "fulfilled").length;
}
