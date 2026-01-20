// src/app/runs/[runsId]/page.tsx
import RunTimeline from "@/components/runs/RunTimeline";

export default function RunPage({
  params,
}: {
  params: { runsId: string; runId?: string };
}) {
  const runId = params.runId ?? params.runsId;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Run</h1>
      <div className="text-sm opacity-80 mb-6">{runId}</div>

      <div className="rounded-xl border border-white/10 p-4">
        <RunTimeline runId={runId} />
      </div>
    </div>
  );
}
