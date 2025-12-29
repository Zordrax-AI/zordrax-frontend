import { RunTimeline } from "@/components/runs/RunTimeline";

export default function RunPage({
  params,
}: {
  params: { runId: string };
}) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">
        Run {params.runId}
      </h1>

      <RunTimeline runId={params.runId} />
    </div>
  );
}
