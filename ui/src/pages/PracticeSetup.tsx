import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/lib/router";
import { companiesApi } from "../api/companies";
import { queryKeys } from "../lib/queryKeys";
import { useCompany } from "../context/CompanyContext";
import { seedStarterAgents } from "../lib/seed-starter-agents";
import { setPracticeCompanyId } from "../lib/practice-company";
import { ThemeToggle } from "../components/ThemeToggle";

const BG = "var(--background)";
const SURFACE = "var(--card)";
const BORDER = "var(--border)";
const ACCENT = "var(--brand)";

export function PracticeSetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setSelectedCompanyId } = useCompany();

  const [practiceName, setPracticeName] = useState("Proactiva");
  const [mission, setMission] = useState(
    "AI consultancy for SMBs — deploy agent teams that observe workflow, surface muddle, and verify savings.",
  );
  const [seedDefaults, setSeedDefaults] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createPractice = useMutation({
    mutationFn: async () => {
      const company = await companiesApi.create({
        name: practiceName.trim(),
        description: mission.trim() || null,
      });
      setPracticeCompanyId(company.id);
      if (seedDefaults) {
        await seedStarterAgents(company.id);
      }
      return company;
    },
    onSuccess: async (company) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      setSelectedCompanyId(company.id);
      // Land on the agents page so the consultant can review/edit the roster.
      navigate(`/${company.issuePrefix}/agents/all`);
    },
    onError: (err: unknown) => {
      setError(
        err instanceof Error ? err.message : "Could not create the practice.",
      );
    },
  });

  const fieldStyle = {
    backgroundColor: "var(--background)",
    border: "1px solid var(--border)",
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: BG, color: "var(--foreground)" }}
    >
      <ThemeToggle variant="floating" />
      <div className="mx-auto max-w-2xl px-6 py-14">
        <div className="mb-8">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: ACCENT }}
          >
            Consultant setup
          </p>
          <h1 className="text-4xl font-semibold tracking-tight leading-tight">
            Set up your practice
          </h1>
          <p className="mt-3 text-sm text-slate-400 max-w-xl">
            Your practice is the home for the agents you reuse across every
            client engagement. You can add agents after this step — or import
            the defaults.
          </p>
        </div>

        <div
          className="rounded-xl p-6 mb-5"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="mb-5">
            <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Practice name
            </label>
            <input
              type="text"
              value={practiceName}
              onChange={(e) => setPracticeName(e.target.value)}
              placeholder="Proactiva"
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
              style={fieldStyle}
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Shows up in your operator UI and on every deliverable.
            </p>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Mission / positioning{" "}
              <span className="text-slate-600 normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              rows={3}
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
            checked={seedDefaults}
            onChange={(e) => setSeedDefaults(e.target.checked)}
            className="mt-1 h-4 w-4 cursor-pointer"
            style={{ accentColor: ACCENT }}
          />
          <span className="text-xs leading-relaxed text-slate-300">
            <span className="font-semibold text-white">
              Seed starter roster (CEO, Observer, Analyst).
            </span>{" "}
            <span className="text-slate-500">
              Adds three Claude-Code agents you can reuse across clients. You
              can edit or remove them on the Agents page.
            </span>
          </span>
        </label>

        <div
          className="rounded-xl p-5 mb-8 text-xs text-slate-400 leading-relaxed"
          style={{
            backgroundColor: "color-mix(in oklab, var(--brand) 6%, transparent)",
            border: "1px solid color-mix(in oklab, var(--brand) 22%, transparent)",
          }}
        >
          <span className="font-semibold text-white">Next:</span> after your
          practice is created you'll land on the Agents page to review the
          roster. Then create your first client engagement.
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/onboarding")}
            className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
          >
            Skip — go to client intake
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              createPractice.mutate();
            }}
            disabled={
              !practiceName.trim() || createPractice.isPending
            }
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            style={{
              backgroundColor: "color-mix(in oklab, var(--brand) 20%, transparent)",
              color: "var(--brand)",
              border: "1px solid color-mix(in oklab, var(--brand) 35%, transparent)",
            }}
          >
            {createPractice.isPending ? "Creating…" : "Create practice"}
          </button>
        </div>
      </div>
    </div>
  );
}
