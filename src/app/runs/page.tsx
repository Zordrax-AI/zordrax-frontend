// src/app/runs/page.tsx

export default async function RunsIndex() {
  const base = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

  if (!base) {
    return (
      <div className="p-6 text-red-400">
        NEXT_PUBLIC_ONBOARDING_API_URL not configured
      </div>
    );
  }

  const runs = await fetch(`${base}/api/runs`, {
    cache: "no-store",
  }).then((r) => r.json());

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-xl font-semibold">Runs</h1>

      {runs.map((r: any) => (
        <a
          key={r.run_id}
          href={`/runs/${r.run_id}`}
          className="block rounded border border-slate-800 p-3 hover:bg-slate-900"
        >
          <div className="text-sm">{r.run_id}</div>
          <div className="text-xs opacity-70">{r.status}</div>
        </a>
      ))}
    </div>
  );
}
