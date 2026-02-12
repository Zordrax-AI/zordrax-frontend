// C:\Users\Zordr\Desktop\frontend-repo\src\app\api\agent\[...path]\route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side proxy to the onboarding agent.
 *
 * - Proxies: /api/agent/<path...>  ->  ${AGENT_BASE_URL}/<path...>
 * - Injects server-only AGENT_API_KEY as X-API-Key (never expose in browser)
 * - Preserves querystring
 * - Handles CORS + OPTIONS preflight
 * - Times out upstream calls (10s) so UI doesn't hang
 */
function getAgentBaseUrl(): string {
  const base =
    process.env.AGENT_BASE_URL ||
    process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
    "";
  if (!base) {
    throw new Error("Missing AGENT_BASE_URL (or NEXT_PUBLIC_AGENT_BASE_URL for local dev).");
  }
  return base.replace(/\/+$/, "");
}

function withCors(res: NextResponse) {
  // If you only ever call same-origin from the browser, you can tighten this.
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
    return withCors(new NextResponse(null, { status: 204 }));
  }

  const base = getAgentBaseUrl();

  // Everything AFTER /api/agent/
  const parts = ctx.params?.path ?? [];
  const joined = parts.map((p) => encodeURIComponent(p)).join("/"); // safe joining
  const targetUrl = new URL(`${base}/${joined}`);

  // Preserve querystring
  req.nextUrl.searchParams.forEach((v, k) => targetUrl.searchParams.append(k, v));

  // Forward headers (strip hop-by-hop and anything that causes issues)
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  // ✅ Always inject server-only API key if present
  const serverApiKey = process.env.AGENT_API_KEY;
  if (serverApiKey) {
    headers.set("X-API-Key", serverApiKey);
  } else {
    // If you rely on caller-provided x-api-key, remove this delete.
    headers.delete("x-api-key");
  }

  // Build upstream request
  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  // Only forward body for methods that can have one
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  // Fail fast so UI doesn't hang forever
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

    return withCors(NextResponse.json({ detail: msg }, { status: 502 }));
  } finally {
    clearTimeout(timer);
  }

  // Copy upstream headers (avoid gzip/content-encoding issues)
  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete("content-encoding");

  // Pass through response body
  const data = await upstream.arrayBuffer();

  const res = new NextResponse(data, {
    status: upstream.status,
    headers: resHeaders,
  });

  return withCors(res);
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
