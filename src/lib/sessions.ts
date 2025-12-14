export type SessionRecord = {
  id: string;                 // run_id
  created_at: string;         // ISO
  mode: "ai" | "manual";
  title: string;              // display name
  status: "queued" | "running" | "completed" | "failed" | "unknown";
};

const KEY = "zordrax.portal.sessions.v1";

export function loadSessions(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: SessionRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(sessions));
}

export function upsertSession(record: SessionRecord) {
  const existing = loadSessions();
  const idx = existing.findIndex((s) => s.id === record.id);
  if (idx >= 0) existing[idx] = { ...existing[idx], ...record };
  else existing.unshift(record);
  saveSessions(existing);
  return existing;
}
