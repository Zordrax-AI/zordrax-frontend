type ZaOptions = {
  method?: "GET" | "POST" | "PUT";
  body?: any;
};

export async function zaFetch(path: string, opts: ZaOptions = {}) {
  const { method = "GET", body } = opts;
  const init: RequestInit = {
    method,
    headers: {},
  };
  if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`/api/za${path}`, init);
  const text = await res.text();
  let parsed: any = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* leave parsed as text */
  }
  if (!res.ok) {
    const msg =
      typeof parsed === "string"
        ? parsed || res.statusText
        : parsed?.message || res.statusText || "Request failed";
    throw new Error(msg);
  }
  return parsed;
}
