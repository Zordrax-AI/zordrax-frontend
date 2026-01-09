// src/lib/api.ts
import { z } from "zod";

/* =========================
   Recommendation Mode
========================= */

export type RecommendMode = "manual" | "ai";

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

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return (await res.text()) as T;
  }

  return (await res.json()) as T;
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

export const RecommendResponseSchema = z.object({
  cloud: z.string(),
  region: z.string(),
  env: z.string(),
  warehouse: z.string(),
  etl: z.string(),
  bi: z.string(),
  governance: z.string(),
  generated_at: z.string().optional(),
  source: z.string().optional(),
});
export type RecommendResponse = z.infer<typeof RecommendResponseSchema>;

export async function recommendStack(payload: RecommendRequest) {
  const safe = RecommendRequestSchema.parse(payload);
  const raw = await request<unknown>(`/ai/recommend-stack`, {
    method: "POST",
    body: JSON.stringify(safe),
  });
  return RecommendResponseSchema.parse(raw);
}

/* =========================
   Recommendation Snapshots
========================= */

export const RecommendationSnapshotSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  ai: z.any(),
  final: z.any(),
  diff: z.array(z.any()),
  source_query: z.record(z.string(), z.string()).optional(),
  run_id: z.string().optional(),
});

export type RecommendationSnapshot = z.infer<
  typeof RecommendationSnapshotSchema
>;

export async function saveRecommendationSnapshot(
  payload: RecommendationSnapshot
) {
  const safe = RecommendationSnapshotSchema.parse(payload);
  return request<{ id: string; status: string }>(`/recommendations`, {
    method: "POST",
    body: JSON.stringify(safe),
  });
}

export async function loadRecommendationSnapshot(recId: string) {
  const raw = await request<unknown>(`/recommendations/${recId}`);
  return RecommendationSnapshotSchema.parse(raw);
}

/* =========================
   Terraform Outputs (CRITICAL FIX)
========================= */

export const TerraformOutputValueSchema = z.object({
  value: z.any(),
  type: z.any().optional(),
  sensitive: z.boolean().optional(),
});

export type TerraformOutputValue = z.infer<
  typeof TerraformOutputValueSchema
>;

export const TerraformOutputsSchema = z.record(
  z.string(),
  TerraformOutputValueSchema
);

export type TerraformOutputs = z.infer<
  typeof TerraformOutputsSchema
>;

/* =========================
   Runs
========================= */

export const RunRowSchema = z.object({
  run_id: z.string(),
  mode: z.string(),
  title: z.string(),
  status: z.string(),
  stage: z.string().nullable().optional(),
  created_at: z.string(),
  cancel_requested: z.boolean().optional(),

  manifest: z
    .object({
      outputs: TerraformOutputsSchema.optional(),
    })
    .optional(),
});

export type RunRow = z.infer<typeof RunRowSchema>;

export const RunEventSchema = z.object({
  event_id: z.number(),
  run_id: z.string(),
  level: z.string(),
  status: z.string(),
  stage: z.string(),
  message: z.string(),
  created_at: z.string(),
});
export type RunEvent = z.infer<typeof RunEventSchema>;

export function createRun(mode: string, title: string) {
  return request<{ run_id: string }>(`/runs/`, {
    method: "POST",
    body: JSON.stringify({ mode, title }),
  });
}

export function executeRun(runId: string) {
  return request(`/runs/${runId}/execute`, { method: "POST" });
}

export function cancelRun(runId: string) {
  return request(`/runs/${runId}/cancel`, { method: "POST" });
}

export async function listRuns() {
  const raw = await request<unknown>(`/runs/`);
  return z.array(RunRowSchema).parse(raw);
}

export async function getRun(runId: string) {
  const raw = await request<unknown>(`/runs/${runId}`);
  return RunRowSchema.parse(raw);
}

export async function getRunEvents(runId: string, afterId = 0) {
  const raw = await request<unknown>(
    `/runs/${runId}/events?after_id=${afterId}`
  );
  return z.array(RunEventSchema).parse(raw);
}
