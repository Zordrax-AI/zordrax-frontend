import { useMemo, useState } from "react";
import { TableInfo } from "@/lib/types";

interface Props {
  tables: TableInfo[];
  selected: string[];
  onChange: (next: string[]) => void;
}

function tableId(t: TableInfo) {
  return t.schema ? `${t.schema}.${t.name}` : t.name;
}

export function TableSelector({ tables, selected, onChange }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tables.filter((t) => {
      const id = tableId(t).toLowerCase();
      return !q || id.includes(q);
    });
  }, [tables, search]);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => onChange(filtered.map(tableId));
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tables"
          className="flex-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm text-[color:var(--fg)]"
        />
        <button className="text-sm text-blue-600 dark:text-blue-300" onClick={selectAll} type="button">
          Select all
        </button>
        <button className="text-sm text-muted-foreground" onClick={clearAll} type="button">
          Clear
        </button>
      </div>

      <div className="border border-[color:var(--border)] rounded-lg divide-y divide-[color:var(--border)]">
        {filtered.length === 0 && <div className="p-4 text-sm text-[color:var(--muted)]">No tables match.</div>}
        {filtered.map((t) => {
          const id = tableId(t);
          const checked = selected.includes(id);
          return (
            <label key={id} className="flex items-center gap-3 p-3 hover:bg-[color:var(--card-2)] cursor-pointer">
              <input type="checkbox" checked={checked} onChange={() => toggle(id)} className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium text-[color:var(--fg)]">{id}</div>
                <div className="text-xs text-[color:var(--muted)]">
                  {t.row_estimate ? `${t.row_estimate.toLocaleString()} rows` : "rows n/a"} -{" "}
                  {t.size_bytes_estimate ? `${Math.round(t.size_bytes_estimate / 1024 / 1024)} MB` : "size n/a"}
                </div>
                {t.pii_flags && t.pii_flags.length > 0 && (
                  <div className="text-[11px] text-amber-600 dark:text-amber-300">PII: {t.pii_flags.join(", ")}</div>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

