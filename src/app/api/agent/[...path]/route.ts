// src/app/api/agent/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAgentBaseUrl(): string {
  const base =
    process.env.AGENT_BASE_URL ||
    process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
    "";
  if (!base) throw new Error("Missing AGENT_BASE_URL or NEXT_PUBLIC_AGENT_BASE_URL");
  return base.replace(/\/+$/, "");
}

function cors(res: NextResponse) {
  // Optional: keep if you want tooling / preflight to behave
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key, X-Idempotency-Key"
  );
  return res;
}

async function proxy(req: NextRequest, ctx: { params: { path?: string[] } }) {
  // Preflight
  if (req.method === "OPTIONS") {
    return cors(new NextResponse(null, { status: 204 }));
  }

  const base = getAgentBaseUrl();

  const parts = Array.isArray(ctx?.params?.path) ? ctx.params.path : [];
  const joined = parts.join("/");

  // Example:
  // /api/agent/api/brd/sessions  -> joined = "api/brd/sessions"
  const target = new URL(`${base}/${joined}`);

  // Copy querystring
  req.nextUrl.searchParams.forEach((v, k) => target.searchParams.append(k, v));

  // Build headers to forward
  const headers = new Headers();
  // Forward only what we want (avoid hop-by-hop + Next internal headers)
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);

  // Forward x-api-key if caller supplied it; otherwise inject from server env
  const callerKey = req.headers.get("x-api-key");
  const serverKey = process.env.AGENT_API_KEY;
  if (callerKey) headers.set("x-api-key", callerKey);
  else if (serverKey) headers.set("x-api-key", serverKey);

  const idempotency = req.headers.get("x-idempotency-key");
  if (idempotency) headers.set("x-idempotency-key", idempotency);

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  // Timeout (don’t hang UI forever)
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), { ...init, signal: ctrl.signal });
  } catch (e: any) {
    const msg =
      e?.name === "AbortError"
        ? `Upstream timeout after 15s: ${target}`
        : `Upstream fetch error: ${target} :: ${e?.message || String(e)}`;
    return cors(NextResponse.json({ detail: msg }, { status: 502 }));
  } finally {
    clearTimeout(timer);
  }

  // Return upstream body as-is
  const buf = await upstream.arrayBuffer();

  // Copy upstream headers but avoid encoding issues
  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete("content-encoding");
  resHeaders.delete("content-length");

  const res = new NextResponse(buf, {
    status: upstream.status,
    headers: resHeaders,
  });

  return cors(res);
}

export async function GET(req: NextRequest, ctx: any) {
  return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: any) {
  return proxy(req, ctx);
}
export async function PUT(req: NextRequest, ctx: any) {
  return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: any) {
  return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: any) {
  return proxy(req, ctx);
}
export async function OPTIONS(req: NextRequest, ctx: any) {
  return proxy(req, ctx);
}
