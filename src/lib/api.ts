// C:\Users\Zordr\Desktop\frontend-repo\src\lib\api.ts
import { z } from "zod";

/* =========================
   Base URL
========================= */

const RAW_BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

// In dev, you can choose to default. If you want strict-only, remove the fallback.
const BASE =
  RAW_BASE && RAW_BASE.trim().length > 0 ? RAW_BASE.trim().replace(/\/$/, "") : "http://localhost:8000";

function url(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${BASE}${path}`;
}

/* =========================
   Error helpers
========================= */

function asErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

async function readErrorBody(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const txt = await res.text();
  if (!txt) return `HTTP ${res.status}`;
  if (ct.includes("application/json")) {
    try {
      const j = JSON.parse(txt);
      // FastAPI often returns {detail: "..."} on errors
      if (j?.detail) return typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
      return JSON.stringify(j);
    } catch {
      return txt;
    }
  }
  return txt;
}

/* =========================
   Retry
========================= */

type RequestOptions = RequestInit & {
  retry?: number; // default 0
  retryDelayMs?: number; // default 400
};

function shouldRetry(res?: Response, err?: unknown) {
  // Retry network errors OR 5xx
  if (err) return true;
  if (!res) return false;
  return res.status >= 500 && res.status <= 599;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { retry = 0, retryDelayMs = 400, ...fetchOptions } = options;

  let attempt = 0;
  let lastErr: unknown = null;

  while (attempt <= retry) {
    try {
      const res = await fetch(url(path), {
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          ...(fetchOptions.headers || {}),
        },
        cache: "no-store",
      });

      if (!res.ok) {
        // do not retry 4xx (especially 404)
        const msg = await readErrorBody(res);
        if (res.status >= 400 && res.status < 500) {
          throw new Error(msg);
        }
        // 5xx can be retried
        if (shouldRetry(res, null) && attempt < retry) {
          await new Promise((r) => setTimeout(r, retryDelayMs * Math.pow(2, attempt)));
          attempt++;
          continue;
        }
        throw new Error(msg);
      }

      // Some endpoints may return empty bodies; handle gracefully
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        // @ts-expect-error - allow non-json responses when typed as any
        return (await res.text()) as T;
      }

      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
      if (attempt < retry && shouldRetry(undefined, e)) {
        await new Promise((r) => setTimeout(r, retryDelayMs * Math.pow(2, attempt)));
        attempt++;
        continue;
      }
      throw new Error(asErrorMessage(e));
    }
  }

  throw new Error(asErrorMessage(lastErr));
}

/* =========================
   Zod Schemas (LOCKED)
========================= */

export const RecommendModeSchema = z.union([z.literal("manual"), z.literal("ai")]);
export type RecommendMode = z.infer<typeof RecommendModeSchema>;

export const RecommendRequestSchema = z.object({
  mode: RecommendModeSchema,
  industry: z.string().min(1),
  scale: z.string().min(1),
  cloud: z.string().min(1),
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
  // allow backend additions without breaking
  generated_at: z.string().optional(),
  source: z.string().optional(),
});
export type RecommendResponse = z.infer<typeof RecommendResponseSchema>;

export const RunRowSchema = z.object({
  run_id: z.string(),
  mode: z.string(),
  title: z.string(),
  status: z.string(),
  stage: z.string().nullable().optional(),
  created_at: z.string(),
  cancel_requested: z.boolean().optional(),

  // IMPORTANT: allow manifest (your UI expects it)
  manifest: z.any().optional(),
});
export type RunRow = z.infer<typeof RunRowSchema>;

export const RunEventSchema = z.object({
  event_id: z.number(),
  run_id: z.string(),
  level: z.union([z.literal("info"), z.literal("warn"), z.literal("error")]),
  status: z.string(),
  stage: z.string(),
  message: z.string(),
  created_at: z.string(),
  data: z.any().optional(),
});
export type RunEvent = z.infer<typeof RunEventSchema>;

/* =========================
   Diagnostics
========================= */

export async function pingBackend() {
  // fast check to prove BASE is correct
  return request<{ status: string }>(`/health`, { retry: 0 });
}

/* =========================
   Run APIs
========================= */

export function createRun(mode: string, title: string) {
  return request<{ run_id: string }>(`/runs/`, {
    method: "POST",
    body: JSON.stringify({ mode, title }),
    retry: 1,
  });
}

export function executeRun(runId: string) {
  return request<{ run_id: string; status: string }>(`/runs/${runId}/execute`, {
    method: "POST",
    retry: 1,
  });
}

export function cancelRun(runId: string) {
  return request<{ run_id: string; status: string }>(`/runs/${runId}/cancel`, {
    method: "POST",
    retry: 0,
  });
}

export async function listRuns() {
  const rows = await request<unknown>(`/runs/`, { retry: 1 });
  return z.array(RunRowSchema).parse(rows);
}

export async function getRun(runId: string) {
  const row = await request<unknown>(`/runs/${runId}`, { retry: 1 });
  return RunRowSchema.parse(row);
}

export async function getRunEvents(runId: string, afterId: number = 0) {
  const ev = await request<unknown>(`/runs/${runId}/events?after_id=${afterId}`, { retry: 1 });
  return z.array(RunEventSchema).parse(ev);
}

export function runEventsStreamUrl(runId: string, afterId = 0) {
  return url(`/runs/${runId}/events/stream?after_id=${afterId}`);
}

/* =========================
   AI Recommend (LOCKED)
========================= */

export async function recommendStack(payload: RecommendRequest) {
  // validate request before send
  const safe = RecommendRequestSchema.parse(payload);

  const raw = await request<unknown>(`/ai/recommend-stack`, {
    method: "POST",
    body: JSON.stringify(safe),
    retry: 2,
    retryDelayMs: 450,
  });

  // validate response strictly
  return RecommendResponseSchema.parse(raw);
}

/* =========================
   Recommendation Snapshots
========================= */

export const SnapshotSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  ai: z.any(),
  final: z.any(),
  diff: z.array(z.any()),
  source_query: z.record(z.string()).optional(),
  run_id: z.string().optional(),
});
export type RecommendationSnapshot = z.infer<typeof SnapshotSchema>;

export function saveRecommendationSnapshot(payload: RecommendationSnapshot) {
  const safe = SnapshotSchema.parse(payload);
  return request<{ id: string; status: string }>(`/recommendations`, {
    method: "POST",
    body: JSON.stringify(safe),
    retry: 1,
  });
}

export async function loadRecommendationSnapshot(recId: string) {
  const raw = await request<unknown>(`/recommendations/${recId}`, { retry: 1 });
  return SnapshotSchema.parse(raw);
}
