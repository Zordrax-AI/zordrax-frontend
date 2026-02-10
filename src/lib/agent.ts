export async function agentFetch(path: string, init?: RequestInit) {
  const url = `/api/agent${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`agentFetch ${res.status}: ${txt || res.statusText}`);
  }
  return res;
}
