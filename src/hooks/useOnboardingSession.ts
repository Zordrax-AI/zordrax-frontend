"use client";

import { useEffect, useState } from "react";
import { fetchSession, SessionDetail } from "@/lib/onboardingConsoleApi";

// -----------------------------------------------------
// Exported storage helpers (required by useDeploymentWorkflow)
// -----------------------------------------------------
export const LOCAL_KEY = "zordrax:lastSessionId";

export function saveLastSessionId(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEY, id);
  } catch {
    // ignore storage errors (CI, private mode, etc.)
  }
}

export function loadLastSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LOCAL_KEY);
  } catch {
    return null;
  }
}

// -----------------------------------------------------
// Main hook
// -----------------------------------------------------
export function useOnboardingSession(initialSessionId?: string) {
  const [sessionId, setSessionId] = useState<string | null>(
    initialSessionId ?? null
  );
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load previous session on first render
  useEffect(() => {
    if (sessionId) return;

    const remembered = loadLastSessionId();
    if (remembered) {
      setSessionId(remembered);
    }
  }, [sessionId]);

  // Fetch session whenever ID changes
  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSession(sessionId);
        if (!cancelled) {
          setSession(data);
          saveLastSessionId(sessionId);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load session"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return {
    sessionId,
    session,
    loading,
    error,
    setSessionId,
  };
}
