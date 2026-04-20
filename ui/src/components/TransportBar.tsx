import { useEffect, useState } from "react";

export type TransportState = "stopped" | "playing" | "paused";

interface TransportBarProps {
  state: TransportState;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  /** Elapsed seconds in current session. If undefined, computed from a lazy clock. */
  elapsed?: number;
  /** Label to the right of the controls. */
  caption?: string;
}

function formatElapsed(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function TransportBar({
  state,
  onPlay,
  onPause,
  onStop,
  elapsed,
  caption,
}: TransportBarProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const displayedElapsed = elapsed ?? 0;

  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        backgroundColor: "var(--background)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex items-center rounded-xl overflow-hidden"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            onClick={onStop}
            className="px-3 py-2 transition-colors"
            style={{
              backgroundColor:
                state === "stopped" ? "var(--muted)" : "transparent",
            }}
            title="Stop"
            aria-label="Stop"
          >
            <span
              className="block w-3 h-3 rounded-sm"
              style={{
                backgroundColor:
                  state === "stopped"
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
              }}
            />
          </button>
          <button
            type="button"
            onClick={onPlay}
            className="px-3 py-2 transition-colors"
            style={{
              backgroundColor: state === "playing" ? "#10b98130" : "transparent",
            }}
            title="Play"
            aria-label="Play"
          >
            <span
              className="block w-0 h-0"
              style={{
                borderLeft: `8px solid ${state === "playing" ? "#10b981" : "var(--muted-foreground)"}`,
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
              }}
            />
          </button>
          <button
            type="button"
            onClick={onPause}
            className="px-3 py-2 transition-colors"
            style={{
              backgroundColor: state === "paused" ? "#f59e0b30" : "transparent",
            }}
            title="Pause"
            aria-label="Pause"
          >
            <span className="flex gap-0.5">
              <span
                className="block w-1 h-3 rounded-sm"
                style={{
                  backgroundColor:
                    state === "paused" ? "#f59e0b" : "var(--muted-foreground)",
                }}
              />
              <span
                className="block w-1 h-3 rounded-sm"
                style={{
                  backgroundColor:
                    state === "paused" ? "#f59e0b" : "var(--muted-foreground)",
                }}
              />
            </span>
          </button>
        </div>

        {state === "playing" && (
          <span className="relative flex h-2.5 w-2.5" aria-label="Recording">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-red-500" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        )}
        {state === "paused" && (
          <span className="relative flex h-2.5 w-2.5" aria-label="Paused">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: "#f59e0b" }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ backgroundColor: "#f59e0b" }}
            />
          </span>
        )}

        <span
          className="font-mono text-sm font-bold"
          style={{
            color:
              state === "playing"
                ? "#10b981"
                : state === "paused"
                  ? "#f59e0b"
                  : "var(--muted-foreground)",
            textShadow: state === "playing" ? "0 0 8px #10b98140" : "none",
          }}
        >
          {formatElapsed(displayedElapsed)}
        </span>

        <span
          className="font-mono text-[10px]"
          style={{ color: "var(--muted-foreground)" }}
        >
          {now.toLocaleTimeString("en-US", { hour12: false })}
        </span>

        {caption && (
          <span
            className="ml-auto text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            {caption}
          </span>
        )}
      </div>
    </div>
  );
}
