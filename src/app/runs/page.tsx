import RunsList from "@/components/runs/RunsList";

export default function RunsPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Runs</h1>
      <RunsList />
    </div>
  );
}
