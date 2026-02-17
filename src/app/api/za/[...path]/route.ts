"use server";

import { NextRequest, NextResponse } from "next/server";

const ALLOWED_METHODS = ["GET", "POST", "PUT"];

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params);
}

export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params);
}

export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params);
}

async function proxy(req: NextRequest, params: { path: string[] }) {
  const method = req.method.toUpperCase();
  if (!ALLOWED_METHODS.includes(method)) {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const base = process.env.ONBOARDING_BASE_URL;
  const apiKey = process.env.ONBOARDING_API_KEY;
  if (!base || !apiKey) {
    return NextResponse.json({ error: "Proxy not configured" }, { status: 500 });
  }

  const path = params.path?.join("/") ?? "";
  const targetUrl = new URL(`${base.replace(/\/$/, "")}/${path}`);

  // copy query
  req.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  let body: BodyInit | undefined;
  if (method !== "GET") {
    const text = await req.text();
    body = text ? text : undefined;
  }

  const headers: Record<string, string> = {
    "X-API-Key": apiKey,
  };
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (["content-type", "accept"].includes(lower)) {
      headers[key] = value;
    }
  });

  const res = await fetch(targetUrl.toString(), {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  const status = res.status;

  try {
    if (contentType.includes("application/json")) {
      const json = await res.json();
      return NextResponse.json(json, { status });
    }
    const text = await res.text();
    return new NextResponse(text, { status, headers: { "content-type": contentType || "text/plain" } });
  } catch {
    const text = await res.text();
    return new NextResponse(text || "", { status, headers: { "content-type": contentType || "text/plain" } });
  }
}
