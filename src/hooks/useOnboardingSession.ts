"use client";

import { useEffect, useState } from "react";
import { fetchSession, SessionDetail } from "@/lib/onboardingConsoleApi";

const LOCAL_KEY = "zordrax:lastSessionId";

function saveLastSessionId(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEY, id);
  } catch {
    // ignore storage errors in CI / private browsing
  }
}

function loadLastSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LOCAL_KEY);
  } catch {
    return null;
  }
}

export function useOnboardingSession(initialSessionId?: string) {
  const [sessionId, setSessionId] = useState<string | null>(
    initialSessionId ?? null
  );
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // On first load, if we don't have a sessionId use the last one from localStorage
  useEffect(() => {
    if (sessionId) return;
    const remembered = loadLastSessionId();
    if (remembered) {
      setSessionId(remembered);
    }
  }, [sessionId]);

  // Whenever sessionId changes, fetch details
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
        if (!cancelled) {
          setLoading(false);
        }
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
