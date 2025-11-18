"use client";

import { useEffect, useState } from "react";
import {
  fetchSession,
  SessionDetail,
} from "@/lib/onboardingConsoleApi";

const LOCAL_KEY = "zordrax:lastSessionId";

export function saveLastSessionId(id: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCAL_KEY, id);
  }
}

export function loadLastSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LOCAL_KEY);
}

export function useOnboardingSession(initialSessionId?: string) {
  const [sessionId, setSessionId] = useState<string | null>(
    initialSessionId || loadLastSessionId()
  );
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    fetchSession(sessionId)
      .then((data) => {
        setSession(data);
        saveLastSessionId(data.session_id);
        setError(null);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load session");
        setSession(null);
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  return { sessionId, setSessionId, session, loading, error };
}
