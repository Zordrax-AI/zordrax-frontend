import { useMemo } from "react";

type TableItem = { id: string; schema?: string; name?: string };

export function TablesSelector({
  tables,
  selected,
  onToggle,
}: {
  tables: TableItem[];
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const sorted = useMemo(() => [...tables].sort((a, b) => a.id.localeCompare(b.id)), [tables]);
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="px-3 py-2 border-b border-slate-200 text-sm font-semibold text-slate-800">Tables</div>
      <div className="max-h-64 overflow-auto divide-y divide-slate-100">
        {sorted.length === 0 && <div className="p-3 text-sm text-slate-500">No tables</div>}
        {sorted.map((t) => (
          <label key={t.id} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={!!selected[t.id]}
              onChange={() => onToggle(t.id)}
              className="h-4 w-4"
            />
            <span className="font-mono">{t.id}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
