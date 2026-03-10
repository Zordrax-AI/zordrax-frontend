import { NextResponse } from "next/server";

const UPSTREAM_BASE = "http://localhost:8010";

async function proxy(req: Request, ctx: { params: { path?: string[] } }) {
  const parts = ctx?.params?.path ?? [];
  const pathname = parts.join("/");
  const url = `${UPSTREAM_BASE}/${pathname}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const init: RequestInit = {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
    redirect: "manual",
  };

  const upstream = await fetch(url, init);
  const resHeaders = new Headers(upstream.headers);
  resHeaders.set("access-control-allow-origin", "*");
  resHeaders.set("access-control-allow-headers", "*");
  resHeaders.set("access-control-allow-methods", "*");

  const contentType = upstream.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? JSON.stringify(await upstream.json())
    : await upstream.text();

  return new NextResponse(body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export async function GET(req: Request, ctx: any) { return proxy(req, ctx); }
export async function POST(req: Request, ctx: any) { return proxy(req, ctx); }
export async function PUT(req: Request, ctx: any) { return proxy(req, ctx); }
export async function PATCH(req: Request, ctx: any) { return proxy(req, ctx); }
export async function DELETE(req: Request, ctx: any) { return proxy(req, ctx); }
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
    },
  });
}
