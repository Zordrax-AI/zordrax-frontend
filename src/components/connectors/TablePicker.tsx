"use client";

type TableInfo = { schema: string; table: string; type?: string; rows?: number; notes?: string };

type Props = {
  tables: TableInfo[];
  selected: Record<string, boolean>;
  onToggle: (key: string) => void;
  onToggleAll: () => void;
};

export function TablePicker({ tables, selected, onToggle, onToggleAll }: Props) {
  const allSelected = tables.length > 0 && tables.every((t) => selected[keyFor(t)]);

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={allSelected} onChange={onToggleAll} />
          <span>Select all in schema</span>
        </div>
        <div className="text-xs text-slate-500">{Object.values(selected).filter(Boolean).length} selected</div>
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="w-10 py-2"></th>
              <th className="text-left py-2 px-2">Table</th>
              <th className="text-left py-2 px-2">Type</th>
              <th className="text-left py-2 px-2">Rows</th>
              <th className="text-left py-2 px-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => {
              const key = keyFor(t);
              const checked = !!selected[key];
              return (
                <tr key={key} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="text-center">
                    <input type="checkbox" checked={checked} onChange={() => onToggle(key)} />
                  </td>
                  <td className="py-2 px-2 font-mono text-slate-800">{t.table}</td>
                  <td className="py-2 px-2 text-slate-600">{t.type || "table"}</td>
                  <td className="py-2 px-2 text-slate-600">{t.rows ? t.rows.toLocaleString() : "—"}</td>
                  <td className="py-2 px-2 text-slate-500">{t.notes || ""}</td>
                </tr>
              );
            })}
            {tables.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500">
                  No tables found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function keyFor(t: TableInfo) {
  return `${t.schema}.${t.table}`;
}
