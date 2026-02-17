import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
export async function OPTIONS(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

async function proxy(req: NextRequest, pathParts: string[]) {
  const method = req.method.toUpperCase();
  if (!ALLOWED_METHODS.includes(method)) {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const base = process.env.ONBOARDING_BASE_URL;
  const apiKey = process.env.ONBOARDING_API_KEY;
  if (!base || !apiKey) {
    return NextResponse.json({ error: "Proxy not configured" }, { status: 500 });
  }

  const path = (pathParts ?? []).join("/");
  const targetUrl = new URL(`${base.replace(/\/$/, "")}/${path}`);

  // copy query params
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  // body (raw bytes)
  let body: BodyInit | undefined = undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const buf = await req.arrayBuffer();
    body = buf.byteLength ? Buffer.from(buf) : undefined;
  }

  // headers
  const headers = new Headers();
  headers.set("X-API-Key", apiKey);

  const passthrough = ["content-type", "accept", "authorization"];
  req.headers.forEach((value, key) => {
    if (passthrough.includes(key.toLowerCase())) headers.set(key, value);
  });

  const res = await fetch(targetUrl.toString(), {
    method,
    headers,
    body,
    cache: "no-store",
    redirect: "follow",
  });

  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const out = await res.arrayBuffer();

  return new NextResponse(out, {
    status: res.status,
    headers: { "content-type": contentType },
  });
}
