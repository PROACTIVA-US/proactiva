import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/lib/router";
import { companiesApi } from "../api/companies";
import { queryKeys } from "../lib/queryKeys";
import { useCompany } from "../context/CompanyContext";
import { TransportBar } from "../components/TransportBar";
import { ThemeToggle } from "../components/ThemeToggle";

const INTAKE_BG = "var(--background)";
const INTAKE_SURFACE = "var(--card)";
const INTAKE_BORDER = "var(--border)";
const INTAKE_ACCENT = "var(--brand)";

const INDUSTRIES = [
  "Property management",
  "Professional services",
  "Healthcare / clinic",
  "Retail / e-commerce",
  "Construction / trades",
  "Manufacturing",
  "Hospitality",
  "Nonprofit",
  "Other",
] as const;

const OBSERVATION_WINDOWS = [
  { value: "7", label: "1 week" },
  { value: "14", label: "2 weeks" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
] as const;

export function ClientIntake() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setSelectedCompanyId, companies } = useCompany();
  const isFirstRun = companies.length === 0;

  const [clientName, setClientName] = useState("");
  const [industry, setIndustry] = useState<string>("");
  const [observationDays, setObservationDays] = useState<string>("30");
  const [engagementGoal, setEngagementGoal] = useState("");
  const [observationFocus, setObservationFocus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createEngagement = useMutation({
    mutationFn: async () => {
      const metadataLines = [
        industry && `Industry: ${industry}`,
        observationDays &&
          `Observation window: ${
            OBSERVATION_WINDOWS.find((w) => w.value === observationDays)?.label ??
            `${observationDays} days`
          }`,
      ].filter(Boolean) as string[];

      const descriptionParts = [
        engagementGoal.trim(),
        observationFocus.trim() && `Focus: ${observationFocus.trim()}`,
        metadataLines.length > 0 && metadataLines.join("\n"),
      ].filter(Boolean) as string[];

      return companiesApi.create({
        name: clientName.trim(),
        description: descriptionParts.length > 0
          ? descriptionParts.join("\n\n")
          : null,
      });
    },
    onSuccess: async (company) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      setSelectedCompanyId(company.id);
      navigate(`/${company.issuePrefix}/engagement`);
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Could not create the engagement.";
      setError(message);
    },
  });

  const canSubmit =
    clientName.trim().length > 0 && !createEngagement.isPending;

  const fieldStyle = {
    backgroundColor: "var(--background)",
    border: "1px solid var(--border)",
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: INTAKE_BG, color: "var(--foreground)" }}
    >
      <ThemeToggle variant="floating" />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="mb-8">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: "var(--brand)" }}
          >
            {isFirstRun ? "Welcome to Proactiva" : "New engagement"}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight leading-tight">
            {isFirstRun ? "Create your first engagement" : "Onboard a client"}
          </h1>
          <p className="mt-3 text-sm text-slate-400 max-w-xl">
            A client engagement is a room your agents observe and act inside.
            Name it, state the goal, and capture the focus for the observation
            window. You can edit everything later.
          </p>
        </div>

        {isFirstRun && (
          <div
            className="rounded-xl p-4 mb-5 flex items-start gap-3"
            style={{
              backgroundColor: "color-mix(in oklab, var(--brand) 6%, transparent)",
              border: "1px solid color-mix(in oklab, var(--brand) 22%, transparent)",
            }}
          >
            <div
              className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: "var(--brand)" }}
            />
            <div className="flex-1 text-xs leading-relaxed text-slate-300">
              <span className="font-semibold text-white">First time running Proactiva?</span>{" "}
              You can go straight into a client engagement, or{" "}
              <button
                type="button"
                onClick={() => navigate("/setup-practice")}
                className="underline underline-offset-2 hover:text-foreground transition-colors"
                style={{ color: "var(--brand)" }}
              >
                set up your consulting practice first
              </button>{" "}
              to create a shared agent roster you reuse across clients.
            </div>
          </div>
        )}

        <div
          className="rounded-xl p-6 mb-5"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
                Client name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Pacific Ridge Property Management"
                className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
                style={fieldStyle}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                style={fieldStyle}
              >
                <option value="" className="bg-[#0a0a14]">
                  Select an industry…
                </option>
                {INDUSTRIES.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0a0a14]">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Engagement goal
            </label>
            <input
              type="text"
              value={engagementGoal}
              onChange={(e) => setEngagementGoal(e.target.value)}
              placeholder="What should this engagement accomplish?"
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
              style={fieldStyle}
            />
          </div>

          <div className="mb-5">
            <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
              Observation focus{" "}
              <span className="text-slate-600 normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              value={observationFocus}
              onChange={(e) => setObservationFocus(e.target.value)}
              placeholder="What should the agents pay attention to? What muddle are we looking for?"
              rows={4}
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none resize-none"
              style={fieldStyle}
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-2">
              Observation window
            </label>
            <div className="flex flex-wrap gap-2">
              {OBSERVATION_WINDOWS.map((opt) => {
                const active = opt.value === observationDays;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setObservationDays(opt.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: active
                        ? "color-mix(in oklab, var(--brand) 15%, transparent)"
                        : "var(--background)",
                      border: `1px solid ${active ? "color-mix(in oklab, var(--brand) 35%, transparent)" : "var(--border)"}`,
                      color: active ? "var(--brand)" : "var(--foreground)",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-5">{error}</p>
          )}
        </div>

        <TransportBar
          state="stopped"
          caption="Transport becomes active after the engagement is created."
        />

        <div className="mt-8 flex items-center justify-between">
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
              createEngagement.mutate();
            }}
            disabled={!canSubmit}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            style={{
              backgroundColor: "color-mix(in oklab, var(--brand) 20%, transparent)",
              color: "var(--brand)",
              border: "1px solid color-mix(in oklab, var(--brand) 35%, transparent)",
            }}
          >
            {createEngagement.isPending ? "Creating…" : "Create engagement"}
          </button>
        </div>
      </div>
    </div>
  );
}
