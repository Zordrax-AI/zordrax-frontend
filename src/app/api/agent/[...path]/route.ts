// src/app/api/agent/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAgentBaseUrl() {
  // Prefer server-only env var, fall back to NEXT_PUBLIC for local convenience
  const base = process.env.AGENT_BASE_URL || process.env.NEXT_PUBLIC_AGENT_BASE_URL || "";
  if (!base) throw new Error("Missing AGENT_BASE_URL or NEXT_PUBLIC_AGENT_BASE_URL");
  return base.replace(/\/+$/, "");
}

function withCors(res: NextResponse) {
  // Same-origin calls won't need it, but it makes OPTIONS happy and avoids weird tooling issues.
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key, X-Idempotency-Key"
  );
  return res;
}

async function handler(req: NextRequest, ctx: { params: { path: string[] } }) {
  // Preflight
  if (req.method === "OPTIONS") {
    return withCors(new NextResponse(null, { status: 204 }));
  }

  const base = getAgentBaseUrl();

  // IMPORTANT:
  // ctx.params.path contains everything AFTER /api/agent/
  // Example: /api/agent/api/brd/sessions  -> ["api","brd","sessions"]
  const joined = (ctx.params.path || []).join("/");
  const targetUrl = new URL(`${base}/${joined}`);

  // Copy querystring
  req.nextUrl.searchParams.forEach((v, k) => targetUrl.searchParams.append(k, v));

  // Forward headers (remove hop-by-hop)
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  // If agent requires X-API-Key, inject server-side only
  const serverApiKey = process.env.AGENT_API_KEY;
  if (serverApiKey && !headers.get("x-api-key")) {
    headers.set("x-api-key", serverApiKey);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  // Fail fast (so UI doesn't hang)
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl.toString(), { ...init, signal: ctrl.signal });
  } catch (e: any) {
    const msg =
      e?.name === "AbortError"
        ? `Upstream timeout after 10s: ${targetUrl}`
        : `Upstream fetch error: ${targetUrl} :: ${e?.message || String(e)}`;
    return withCors(
      NextResponse.json({ detail: msg }, { status: 502 })
    );
  } finally {
    clearTimeout(timer);
  }

  // Stream back
  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete("content-encoding"); // avoid platform gzip weirdness

  const data = await upstream.arrayBuffer();

  const res = new NextResponse(data, {
    status: upstream.status,
    headers: resHeaders,
  });

  return withCors(res);
}

export async function GET(req: NextRequest, ctx: any) {
  return handler(req, ctx);
}
export async function POST(req: NextRequest, ctx: any) {
  return handler(req, ctx);
}
export async function PUT(req: NextRequest, ctx: any) {
  return handler(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: any) {
  return handler(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: any) {
  return handler(req, ctx);
}
export async function OPTIONS(req: NextRequest, ctx: any) {
  return handler(req, ctx);
}
