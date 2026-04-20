import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/lib/router";
import { useCompany } from "../context/CompanyContext";
import { activityApi } from "../api/activity";
import { agentsApi } from "../api/agents";
import { queryKeys } from "../lib/queryKeys";
import { TransportBar } from "../components/TransportBar";
import { useEngagementSession } from "../lib/useEngagementSession";
import { ThemeToggle } from "../components/ThemeToggle";

const BG = "var(--background)";
const SURFACE = "var(--card)";
const BORDER = "var(--border)";
const ACCENT = "var(--brand)";
const SUCCESS = "#10b981";
const WARN = "#f59e0b";

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">
        {label}
      </p>
      <p
        className="text-2xl font-semibold"
        style={{ color: accent ?? "var(--foreground)" }}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export function ClientDashboard() {
  const navigate = useNavigate();
  const { selectedCompanyId, companies } = useCompany();

  const company = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId],
  );

  const session = useEngagementSession(selectedCompanyId ?? null);
  const queryClient = useQueryClient();
  const [transportBusy, setTransportBusy] = useState(false);
  const [transportError, setTransportError] = useState<string | null>(null);

  async function applyTransportToAgents(next: "playing" | "paused" | "stopped") {
    if (!selectedCompanyId) return;
    setTransportBusy(true);
    setTransportError(null);
    try {
      const agents = await agentsApi.list(selectedCompanyId);
      const live = agents.filter((a) => a.status !== "terminated");
      if (next === "playing") {
        await Promise.allSettled(
          live.map((a) => agentsApi.resume(a.id, selectedCompanyId)),
        );
        await Promise.allSettled(
          live.map((a) => agentsApi.invoke(a.id, selectedCompanyId)),
        );
      } else {
        // paused and stopped both pause the roster; stopped also clears local session.
        await Promise.allSettled(
          live.map((a) => agentsApi.pause(a.id, selectedCompanyId)),
        );
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.list(selectedCompanyId),
      });
    } catch (err) {
      setTransportError(
        err instanceof Error ? err.message : "Transport action failed.",
      );
    } finally {
      setTransportBusy(false);
    }
  }

  const handlePlay = () => {
    session.play();
    void applyTransportToAgents("playing");
  };
  const handlePause = () => {
    session.pause();
    void applyTransportToAgents("paused");
  };
  const handleStop = () => {
    session.stop();
    void applyTransportToAgents("stopped");
  };

  // Loop artifact feed — sourced from the company activity stream for now.
  // This is the visible "QUEUED-with-reasoning → action → result" log the consultancy
  // deliverable is built around. Filtering + display will be refined in later passes.
  const { data: activity } = useQuery({
    queryKey: selectedCompanyId
      ? queryKeys.activity(selectedCompanyId)
      : ["activity", "none"],
    queryFn: () =>
      selectedCompanyId
        ? activityApi.list(selectedCompanyId)
        : Promise.resolve([]),
    enabled: Boolean(selectedCompanyId),
    refetchInterval: session.state === "playing" ? 5000 : false,
  });

  const artifactEntries = Array.isArray(activity) ? activity.slice(0, 40) : [];

  useEffect(() => {
    document.title = company ? `${company.name} · Proactiva` : "Proactiva";
  }, [company]);

  if (!company) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
      >
        <div className="text-center">
          <p className="text-sm text-slate-500 mb-3">No engagement selected.</p>
          <button
            type="button"
            onClick={() => navigate("/onboarding")}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: "color-mix(in oklab, var(--brand) 15%, transparent)",
              color: "var(--brand)",
              border: "1px solid color-mix(in oklab, var(--brand) 35%, transparent)",
            }}
          >
            Start a new engagement
          </button>
        </div>
      </div>
    );
  }

  const statusColor =
    session.state === "playing"
      ? SUCCESS
      : session.state === "paused"
        ? WARN
        : "#64748b";

  const statusLabel =
    session.state === "playing"
      ? "Observing"
      : session.state === "paused"
        ? "Paused"
        : "Stopped";

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <ThemeToggle variant="floating" />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-start justify-between gap-6">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
              style={{ color: "var(--brand)" }}
            >
              Engagement
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">{company.name}</h1>
            {company.description && (
              <p className="mt-3 text-sm text-slate-400 max-w-2xl whitespace-pre-line">
                {company.description}
              </p>
            )}
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              backgroundColor: `${statusColor}20`,
              border: `1px solid ${statusColor}55`,
              color: statusColor,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: statusColor }}
            />
            {statusLabel}
          </div>
        </div>

        <div className="mb-8">
          <TransportBar
            state={session.state}
            elapsed={session.elapsedSeconds}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            caption={
              transportBusy
                ? "Syncing roster…"
                : transportError
                  ? transportError
                  : session.state === "playing"
                    ? "Loop is active — agents are running. Tasks stream below."
                    : session.state === "paused"
                      ? "Loop paused. Agents resumed will pick up on next play."
                      : "Press play to wake the roster and start the loop."
            }
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatTile
            label="Loop status"
            value={statusLabel}
            sub={
              session.elapsedSeconds > 0
                ? `Session elapsed: ${Math.floor(session.elapsedSeconds / 60)}m`
                : "Not yet started"
            }
            accent={statusColor}
          />
          <StatTile
            label="Queued-w/-reasoning"
            value={String(artifactEntries.length)}
            sub="Artifact entries"
            accent={ACCENT}
          />
          <StatTile label="Muddle items" value="—" sub="Coming soon" />
          <StatTile label="Verified savings" value="—" sub="Coming soon" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            className="lg:col-span-2 rounded-xl p-5"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Loop artifact feed
              </h2>
              <span className="text-[10px] text-slate-600">
                {session.state === "playing" ? "Live · auto-refreshing" : "Idle"}
              </span>
            </div>
            {artifactEntries.length > 0 ? (
              <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
                {artifactEntries.map((entry) => {
                  const summary =
                    (entry.details?.summary as string | undefined) ??
                    (entry.details?.message as string | undefined) ??
                    entry.action.replace(/_/g, " ");
                  return (
                    <li
                      key={entry.id}
                      className="rounded-lg px-3 py-2.5 text-xs leading-relaxed"
                      style={{
                        backgroundColor: BG,
                        border: `1px solid ${BORDER}`,
                      }}
                    >
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <span className="font-mono text-[10px]">
                          {new Date(entry.createdAt).toLocaleTimeString("en-US", {
                            hour12: false,
                          })}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider">
                          {entry.entityType} · {entry.action}
                        </span>
                      </div>
                      <p className="text-slate-200 whitespace-pre-line break-words">
                        {summary}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div
                className="rounded-lg px-6 py-12 text-center text-sm text-slate-500"
                style={{ backgroundColor: "var(--background)", border: "1px dashed var(--border)" }}
              >
                {session.state === "playing"
                  ? "Waiting for the first loop entry…"
                  : "Press play on the transport to begin capturing loop artifacts."}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
                Muddle
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Inefficiencies the loop identifies will surface here. Each item
                gets an estimated cost and a tracked intervention.
              </p>
            </div>
            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
                Verified savings
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Running tally of savings attributed to interventions this loop
                has produced — the visible proof of methodology.
              </p>
            </div>
            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
                Operator tools
              </h2>
              <button
                type="button"
                onClick={() => navigate(`/${company.issuePrefix}/dashboard`)}
                className="text-xs w-full text-left px-3 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                Open operator dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
