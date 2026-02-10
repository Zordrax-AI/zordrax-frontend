// src/app/api/agent/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function agentBase(): string {
  const base =
    process.env.AGENT_BASE_URL ||
    process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
    "";

  if (!base) {
    throw new Error("Missing AGENT_BASE_URL or NEXT_PUBLIC_AGENT_BASE_URL");
  }

  return base.replace(/\/+$/, "");
}

function withCors(res: NextResponse) {
  // This makes OPTIONS/preflight happy and avoids edge cases.
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key, X-Idempotency-Key"
  );
  return res;
}

async function proxy(req: NextRequest, ctx: { params: { path: string[] } }) {
  // Handle browser preflight safely
  if (req.method === "OPTIONS") {
    return withCors(new NextResponse(null, { status: 204 }));
  }

  const base = agentBase();
  const path = (ctx.params.path || []).join("/");
  const target = new URL(`${base}/${path}`);

  // Preserve querystring
  req.nextUrl.searchParams.forEach((v, k) => target.searchParams.append(k, v));

  // Forward headers (minus hop-by-hop)
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  // Optional server-side API key (ONLY if you set it in Vercel/local env)
  // This keeps the key out of the browser.
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

  const upstream = await fetch(target.toString(), init);

  // Stream response back
  const outHeaders = new Headers(upstream.headers);
  outHeaders.delete("content-encoding");

  const buf = await upstream.arrayBuffer();
  const res = new NextResponse(buf, {
    status: upstream.status,
    headers: outHeaders,
  });

  return withCors(res);
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
