import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonErr(status: number, msg: string) {
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(req: Request, ctx: { params: { path: string[] } }) {
  return forward(req, ctx);
}
export async function POST(req: Request, ctx: { params: { path: string[] } }) {
  return forward(req, ctx);
}
export async function PUT(req: Request, ctx: { params: { path: string[] } }) {
  return forward(req, ctx);
}
export async function PATCH(req: Request, ctx: { params: { path: string[] } }) {
  return forward(req, ctx);
}
export async function DELETE(req: Request, ctx: { params: { path: string[] } }) {
  return forward(req, ctx);
}

async function forward(req: Request, ctx: { params: { path: string[] } }) {
  const base = process.env.AGENT_BASE_URL;
  if (!base) return jsonErr(500, "Missing AGENT_BASE_URL");

  const url = new URL(req.url);

  const path = ctx.params.path.join("/");

  // Ensure BRD calls have exactly one /api/brd prefix; leave other paths untouched.
  // Accept inputs like:
  //   api/brd/sessions
  //   brd/sessions
  //   health
  //   api/deploy/plan
  const normalizedPath = path.startsWith("api/brd/")
    ? path
    : path.startsWith("brd/")
      ? `api/${path}`
      : path;

  const upstreamUrl = `${base.replace(/\/+$/, "")}/${normalizedPath}` + url.search;

  const controller = new AbortController();
  const timeoutMs = Number(process.env.AGENT_PROXY_TIMEOUT_MS || "30000");
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const method = req.method.toUpperCase();
    const body = method === "GET" || method === "HEAD" ? undefined : await req.text();

    const headers = new Headers();
    const ct = req.headers.get("content-type");
    if (ct) headers.set("content-type", ct);

    const apiKey = req.headers.get("x-api-key");
    if (apiKey) headers.set("x-api-key", apiKey);

    const auth = req.headers.get("authorization");
    if (auth) headers.set("authorization", auth);

    const upstream = await fetch(upstreamUrl, {
      method,
      headers,
      body,
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json";

    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    if (e?.name === "AbortError") return jsonErr(504, "Upstream timeout");
    return jsonErr(502, e?.message || "Upstream error");
  } finally {
    clearTimeout(t);
  }
}
