export async function listRuns(
  limit = 50,
  offset = 0
): Promise<ZordraxRun[]> {
  assertBase();

  const url = new URL(`${base}/runs`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const res = await fetch(url.toString(), { method: "GET" });
  const json = await okJson<{ items: ZordraxRun[] }>(res);

  return json.items;
}
