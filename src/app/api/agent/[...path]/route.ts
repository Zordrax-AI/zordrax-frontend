// src/app/api/agent/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAgentBaseUrl() {
  const base =
    process.env.AGENT_BASE_URL ||
    process.env.NEXT_PUBLIC_AGENT_BASE_URL ||
    "";

  if (!base) throw new Error("Missing AGENT_BASE_URL or NEXT_PUBLIC_AGENT_BASE_URL");
  return base.replace(/\/+$/, "");
}

function cors(res: NextResponse) {
  // same-origin calls don't need it, but OPTIONS does
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, X-Idempotency-Key");
  return res;
}

async function proxy(req: NextRequest, ctx: { params: { path: string[] } }) {
  if (req.method === "OPTIONS") return cors(new NextResponse(null, { status: 204 }));

  const base = getAgentBaseUrl();
  const joined = (ctx.params.path ?? []).join("/");

  // NOTE: joined might be "api/brd/sessions" etc
  const target = new URL(`${base}/${joined}`);

  // forward query string
  req.nextUrl.searchParams.forEach((v, k) => target.searchParams.append(k, v));

  // forward headers (strip hop-by-hop)
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  // If backend needs x-api-key, set AGENT_API_KEY in Vercel env (server only) and it will attach here.
  const serverKey = process.env.AGENT_API_KEY;
  if (serverKey && !headers.get("x-api-key")) headers.set("x-api-key", serverKey);

  const init: RequestInit = { method: req.method, headers, redirect: "manual" };

  if (req.method !== "GET" && req.method !== "HEAD") {
    // keep body raw; upstream is FastAPI and expects JSON text fine
    init.body = await req.text();
  }

  const upstream = await fetch(target.toString(), init);

  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete("content-encoding");

  const buf = await upstream.arrayBuffer();
  const res = new NextResponse(buf, { status: upstream.status, headers: resHeaders });
  return cors(res);
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
