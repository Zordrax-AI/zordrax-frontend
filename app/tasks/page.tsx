import TaskIntakePanel from "../orchestrator/task-intake-panel";

export default function TasksPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-sm text-cyan-200">Zordrax-Analytica</p>
          <h1 className="mt-2 text-3xl font-bold">AI Build Task Intake</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Paste, bulk-load, hold, review, and release AI Build Tasks into the autonomous build runner.
          </p>
          <a href="/orchestrator" className="mt-4 inline-flex rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950">
            Back to Orchestrator
          </a>
        </header>

        <TaskIntakePanel />
      </div>
    </main>
  );
}
