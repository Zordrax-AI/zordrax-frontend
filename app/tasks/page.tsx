import TaskLoadTablePanel from "../orchestrator/task-load-table-panel";

export default function TasksPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-sm text-cyan-200">Zordrax-Analytica</p>
          <h1 className="mt-2 text-3xl font-bold">AI Build Task Loader</h1>
          <p className="mt-2 max-w-4xl text-sm text-slate-300">
            Load tasks using a spreadsheet-style table, paste from Excel, or upload CSV/Excel. Review and release tasks into the autonomous AI Build Runner.
          </p>
          <a href="/orchestrator" className="mt-4 inline-flex rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950">
            Back to Orchestrator
          </a>
        </header>
        <TaskLoadTablePanel />
      </div>
    </main>
  );
}
