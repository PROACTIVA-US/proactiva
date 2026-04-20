import { useCallback, useEffect, useRef, useState } from "react";
import type { TransportState } from "../components/TransportBar";

/**
 * Per-engagement observation session state, persisted in localStorage so a
 * reload or tab-close doesn't reset the loop timer. This is the client-facing
 * equivalent of the underlying heartbeat-driven execution: a visible, consultant-
 * controlled transport over the engagement's learning loop.
 *
 * Wire-in to real heartbeats / agent activity happens in a later step —
 * for now this tracks state + elapsed time only.
 */

type PersistedSession = {
  state: TransportState;
  // Epoch ms when the current `playing` period started. null when not playing.
  runningSince: number | null;
  // Accumulated seconds from all prior playing periods (excluding the current one).
  accumulatedSeconds: number;
};

const DEFAULT_SESSION: PersistedSession = {
  state: "stopped",
  runningSince: null,
  accumulatedSeconds: 0,
};

function storageKey(companyId: string): string {
  return `proactiva:engagement-session:${companyId}`;
}

function readSession(companyId: string): PersistedSession {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return DEFAULT_SESSION;
    const parsed = JSON.parse(raw) as Partial<PersistedSession>;
    return {
      state: parsed.state === "playing" || parsed.state === "paused" ? parsed.state : "stopped",
      runningSince:
        typeof parsed.runningSince === "number" ? parsed.runningSince : null,
      accumulatedSeconds:
        typeof parsed.accumulatedSeconds === "number" &&
        Number.isFinite(parsed.accumulatedSeconds)
          ? parsed.accumulatedSeconds
          : 0,
    };
  } catch {
    return DEFAULT_SESSION;
  }
}

function writeSession(companyId: string, session: PersistedSession): void {
  try {
    localStorage.setItem(storageKey(companyId), JSON.stringify(session));
  } catch {
    // localStorage full or disabled — ignore; in-memory state still works for the session.
  }
}

function elapsedForSession(session: PersistedSession, nowMs: number): number {
  const running =
    session.state === "playing" && session.runningSince != null
      ? Math.max(0, Math.floor((nowMs - session.runningSince) / 1000))
      : 0;
  return session.accumulatedSeconds + running;
}

interface EngagementSession {
  state: TransportState;
  elapsedSeconds: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
}

export function useEngagementSession(companyId: string | null): EngagementSession {
  const [session, setSession] = useState<PersistedSession>(() =>
    companyId ? readSession(companyId) : DEFAULT_SESSION,
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const companyIdRef = useRef<string | null>(companyId);

  // Re-load when company changes.
  useEffect(() => {
    if (companyId !== companyIdRef.current) {
      companyIdRef.current = companyId;
      setSession(companyId ? readSession(companyId) : DEFAULT_SESSION);
    }
  }, [companyId]);

  // Tick the clock every second only when playing — reduces re-renders while paused/stopped.
  useEffect(() => {
    if (session.state !== "playing") return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [session.state]);

  const mutate = useCallback(
    (updater: (prev: PersistedSession) => PersistedSession) => {
      setSession((prev) => {
        const next = updater(prev);
        if (companyIdRef.current) writeSession(companyIdRef.current, next);
        return next;
      });
    },
    [],
  );

  const play = useCallback(() => {
    mutate((prev) => {
      if (prev.state === "playing") return prev;
      return {
        state: "playing",
        runningSince: Date.now(),
        accumulatedSeconds: prev.accumulatedSeconds,
      };
    });
    setNowMs(Date.now());
  }, [mutate]);

  const pause = useCallback(() => {
    mutate((prev) => {
      if (prev.state !== "playing") return prev;
      const extra =
        prev.runningSince != null
          ? Math.max(0, Math.floor((Date.now() - prev.runningSince) / 1000))
          : 0;
      return {
        state: "paused",
        runningSince: null,
        accumulatedSeconds: prev.accumulatedSeconds + extra,
      };
    });
  }, [mutate]);

  const stop = useCallback(() => {
    mutate(() => DEFAULT_SESSION);
  }, [mutate]);

  return {
    state: session.state,
    elapsedSeconds: elapsedForSession(session, nowMs),
    play,
    pause,
    stop,
  };
}
