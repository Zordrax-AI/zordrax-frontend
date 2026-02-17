type Event = { ts?: string; status?: string; detail?: string; level?: string };

export function Timeline({ events }: { events: Event[] }) {
  if (!events || events.length === 0) {
    return <div className="text-sm text-slate-500">No events yet.</div>;
  }
  return (
    <div className="space-y-2">
      {events.map((e, idx) => (
        <div key={idx} className="rounded border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-mono text-xs text-slate-500">{e.ts || "—"}</span>
            <span className="px-2 py-1 rounded bg-slate-100 text-slate-800 text-xs uppercase">{e.status || "event"}</span>
            {e.level && <span className="text-xs text-slate-500">{e.level}</span>}
          </div>
          {e.detail && <div className="mt-1 text-sm text-slate-800 whitespace-pre-wrap">{e.detail}</div>}
        </div>
      ))}
    </div>
  );
}
