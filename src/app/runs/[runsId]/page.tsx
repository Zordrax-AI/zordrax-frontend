import RunTimeline from "@/components/runs/RunTimeline";

export default function RunPage({ params }: { params: { runsId: string } }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Run Timeline</h1>
      <div className="text-sm text-slate-400">
        Run ID: <span className="font-mono">{params.runsId}</span>
      </div>
      <RunTimeline runId={params.runsId} />
    </div>
  );
}
