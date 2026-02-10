import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function agentBaseUrl() {
  const base =
    process.env.AGENT_BASE_URL ||
    process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
    "";

  if (!base) throw new Error("Missing AGENT_BASE_URL (recommended) or NEXT_PUBLIC_AGENT_BASE_URL");
  return base.replace(/\/+$/, "");
}

function cors(res: NextResponse) {
  // Your browser calls SAME ORIGIN (/api/agent/...), so CORS isn't required.
  // But OPTIONS preflight sometimes happens, so we make it safe.
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key, X-Idempotency-Key"
  );
  return res;
}

async function proxy(req: NextRequest, ctx: { params: { path: string[] } }) {
  if (req.method === "OPTIONS") return cors(new NextResponse(null, { status: 204 }));

  const base = agentBaseUrl();
  const rest = (ctx.params.path || []).join("/");

  const url = new URL(`${base}/${rest}`);

  // Keep query string
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.append(k, v));

  // Forward headers (sanitize hop-by-hop)
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  // Optional: attach server-side API key if your agent requires it
  // IMPORTANT: this key must NOT live in the browser.
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

  const upstream = await fetch(url.toString(), init);

  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete("content-encoding");

  const buf = await upstream.arrayBuffer();

  return cors(
    new NextResponse(buf, {
      status: upstream.status,
      headers: resHeaders,
    })
  );
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
