// src/app/api/agent/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAgentBaseUrl() {
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
  // Same-origin calls usually don't need this, but it also makes OPTIONS happy.
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-API-Key, X-Idempotency-Key"
  );
  return res;
}

async function handler(req: NextRequest, ctx: { params: { path: string[] } }) {
  // Handle browser preflight safely
  if (req.method === "OPTIONS") {
    return withCors(new NextResponse(null, { status: 204 }));
  }

  const base = getAgentBaseUrl();
  const joined = (ctx.params.path || []).join("/");
  const targetUrl = new URL(`${base}/${joined}`);

  // Preserve querystring
  req.nextUrl.searchParams.forEach((v, k) => targetUrl.searchParams.append(k, v));

  // Forward headers (minus hop-by-hop)
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  // If your agent requires X-API-Key, DO NOT put it in the browser.
  // Put it as AGENT_API_KEY in Vercel env, and the proxy will attach it.
  const serverApiKey = process.env.AGENT_API_KEY;
  if (serverApiKey && !headers.get("x-api-key")) {
    headers.set("x-api-key", serverApiKey);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  // Only attach body for non-GET/HEAD
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  const upstream = await fetch(targetUrl.toString(), init);

  // Stream response back
  const resHeaders = new Headers(upstream.headers);
  resHeaders.delete("content-encoding"); // avoids weirdness on some platforms

  const data = await upstream.arrayBuffer();
  const res = new NextResponse(data, {
    status: upstream.status,
    headers: resHeaders,
  });

  return withCors(res);
}

export async function GET(req: NextRequest, ctx: any) { return handler(req, ctx); }
export async function POST(req: NextRequest, ctx: any) { return handler(req, ctx); }
export async function PUT(req: NextRequest, ctx: any) { return handler(req, ctx); }
export async function PATCH(req: NextRequest, ctx: any) { return handler(req, ctx); }
export async function DELETE(req: NextRequest, ctx: any) { return handler(req, ctx); }
export async function OPTIONS(req: NextRequest, ctx: any) { return handler(req, ctx); }
