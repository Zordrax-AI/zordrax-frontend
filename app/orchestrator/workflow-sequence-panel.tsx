import Link from "next/link";

const sequence = [
  ["1", "Plan", "/platform"],
  ["2", "Board", "/product-board"],
  ["3", "Load", "/product-board/load"],
  ["4", "Queue", "/execution/queue"],
  ["5", "Run AI", "/orchestrator"],
  ["6", "Review PR", "/execution/prs"],
  ["7", "Approve", "/product-board/approvals"],
  ["8", "Progress", "/product-board/status"],
];

export default function WorkflowSequencePanel() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-cyan-700">Recommended Operating Sequence</p>
          <h2 className="mt-1 text-xl font-bold">Plan → Push → Execute → Review → Track</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use this sequence so the orchestrator does not feel like disconnected pages.
          </p>
        </div>
        <Link href="/workflow" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">
          Open Workflow
        </Link>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-4">
        {sequence.map(([num, label, href]) => (
          <Link key={label} href={href} className="rounded-2xl bg-slate-50 p-4 hover:bg-slate-100">
            <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-bold text-white">{num}</span>
            <p className="mt-2 font-bold">{label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
