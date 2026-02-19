// src/lib/za.ts

type ZaOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
};

/**
 * Client-side fetch wrapper that calls Next proxy route: /api/za/*
 * Adds JSON handling + FastAPI-friendly error extraction.
 *
 * Generic return type:
 *   const x = await fetchJson<MyType>("/path")
 */
export async function zaFetch<T = any>(path: string, opts: ZaOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = opts;

  const init: RequestInit = {
    method,
    headers: { ...headers },
  };

  if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`/api/za${path}`, init);

  const text = await res.text();
  let parsed: any = text;

  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // leave parsed as text
  }

  if (!res.ok) {
    // Supports FastAPI shapes:
    // { detail: "..." }
    // { detail: { error: "...", message: "..." } }
    // { message: "..." }
    const msg =
      typeof parsed === "string"
        ? parsed || res.statusText
        : parsed?.detail?.message ||
          parsed?.detail?.error ||
          parsed?.detail ||
          parsed?.message ||
          res.statusText ||
          "Request failed";

    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return parsed as T;
}

// ✅ keep compatibility with existing imports
export const fetchJson = zaFetch;
