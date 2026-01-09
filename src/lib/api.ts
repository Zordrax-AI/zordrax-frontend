// src/lib/api.ts
import { z } from "zod";

/* =========================
   Base URL
========================= */

const RAW_BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

export const BASE =
  RAW_BASE && RAW_BASE.trim().length > 0
    ? RAW_BASE.trim().replace(/\/$/, "")
    : "http://localhost:8000";

function url(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${BASE}${path}`;
}

/* =========================
   Request Helper
========================= */

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json() as Promise<T>;
}

/* =========================
   AI Recommendation
========================= */

export const RecommendRequestSchema = z.object({
  mode: z.union([z.literal("manual"), z.literal("ai")]),
  industry: z.string(),
  scale: z.string(),
  cloud: z.string(),
});

export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;

export async function recommendStack(payload: RecommendRequest) {
  return request(`/ai/recommend-stack`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* =========================
   Recommendation Snapshots
========================= */

export async function saveRecommendationSnapshot(payload: {
  ai: any;
  final: any;
  diff: any[];
}) {
  return request<{ id: string }>(`/recommendations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* =========================
   Deploy (ID-BASED)
========================= */

export async function deployStack(recommendation_id: string) {
  return request<{ run_id: string; status: string }>(`/deploy`, {
    method: "POST",
    body: JSON.stringify({ recommendation_id }),
  });
}

/* =========================
   Runs
========================= */

export async function getRun(runId: string) {
  return request(`/runs/${runId}`);
}

export async function getRunEvents(runId: string, afterId = 0) {
  return request(`/runs/${runId}/events?after_id=${afterId}`);
}
