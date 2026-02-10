import { NextRequest, NextResponse } from "next/server";

function baseUrl() {
  // Use your existing env var (no new secrets talk)
  const v = process.env.NEXT_PUBLIC_AGENT_BASE_URL;
  if (!v) throw new Error("Missing NEXT_PUBLIC_AGENT_BASE_URL");
  return v.replace(/\/+$/, "");
}

async function forward(req: NextRequest, pathParts: string[]) {
  const target = `${baseUrl()}/${pathParts.join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.set("accept", "application/json");

  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.arrayBuffer();

  const res = await fetch(target, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  // Return JSON consistently (your UI expects JSON)
  return NextResponse.json(payload as any, { status: res.status });
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params.path);
}
export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params.path);
}
export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params.path);
}
export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params.path);
}
export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) {
  return forward(req, ctx.params.path);
}
