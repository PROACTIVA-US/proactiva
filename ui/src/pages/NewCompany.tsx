import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/lib/router";
import { companiesApi } from "../api/companies";
import { queryKeys } from "../lib/queryKeys";
import { useCompany } from "../context/CompanyContext";
import { seedStarterAgents } from "../lib/seed-starter-agents";
import { ThemeToggle } from "../components/ThemeToggle";

/**
 * Proactiva-styled new-company page used by the CompanyRail "+" button.
 * Each new company gets its own agent team, its own workspace, and the
 * active company is switched on success so the user lands in the fresh
 * company's dashboard, not the previous one's.
 */
export function NewCompany() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setSelectedCompanyId, companies } = useCompany();

  const [name, setName] = useState("");
  const [mission, setMission] = useState("");
  const [seedRoster, setSeedRoster] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFirst = companies.length === 0;

  const createCompany = useMutation({
    mutationFn: async () => {
      const company = await companiesApi.create({
        name: name.trim(),
        description: mission.trim() || null,
      });
      if (seedRoster) {
        await seedStarterAgents(company.id);
      }
      return company;
    },
    onSuccess: async (company) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      setSelectedCompanyId(company.id);
      navigate(`/${company.issuePrefix}/agents/all`);
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Could not create the company.");
    },
  });

  const fieldStyle = {
    backgroundColor: "var(--background)",
    border: "1px solid var(--border)",
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      <ThemeToggle variant="floating" />
      <div className="mx-auto max-w-2xl px-6 py-14">
        <div className="mb-8">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: "var(--brand)" }}
          >
            {isFirst ? "First company" : "New company"}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight leading-tight">
            {isFirst ? "Create your first company" : "Add a new company"}
          </h1>
          <p className="mt-3 text-sm text-slate-400 max-w-xl">
            Each company has its own agent team, issue workspace, and dashboard.
            Name it, optionally describe its mission, and you're ready to go.
          </p>
        </div>

        <div
          className="rounded-xl p-6 mb-5"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="mb-5">
            <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Company name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
              style={fieldStyle}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Mission / description{" "}
              <span className="text-slate-600 normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              rows={3}
              placeholder="What is this company trying to accomplish?"
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none resize-none"
              style={fieldStyle}
            />
          </div>

          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </div>

        <label
          className="flex items-start gap-3 rounded-xl p-4 mb-5 cursor-pointer"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <input
            type="checkbox"
            checked={seedRoster}
            onChange={(e) => setSeedRoster(e.target.checked)}
            className="mt-1 h-4 w-4 cursor-pointer"
            style={{ accentColor: "var(--brand)" }}
          />
          <span className="text-xs leading-relaxed text-slate-300">
            <span className="font-semibold text-white">
              Seed a starter agent team (CEO, Observer, Analyst).
            </span>{" "}
            <span className="text-slate-500">
              Three Claude-Code agents scoped to this company. Edit or remove
              them on the Agents page.
            </span>
          </span>
        </label>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              createCompany.mutate();
            }}
            disabled={!name.trim() || createCompany.isPending}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            style={{
              backgroundColor: "color-mix(in oklab, var(--brand) 20%, transparent)",
              color: "var(--brand)",
              border: "1px solid color-mix(in oklab, var(--brand) 35%, transparent)",
            }}
          >
            {createCompany.isPending ? "Creating…" : "Create company"}
          </button>
        </div>
      </div>
    </div>
  );
}
