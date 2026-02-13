"use client";

type Props = {
  schemas: Record<string, string[]>;
  selectedSchema: string | null;
  onSelectSchema: (s: string) => void;
  search: string;
  onSearch: (v: string) => void;
};

export function SchemaSidebar({ schemas, selectedSchema, onSelectSchema, search, onSearch }: Props) {
  const entries = Object.entries(schemas).filter(([s]) => s.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-3">
      <input
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        placeholder="Search schemas"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className="space-y-1">
        {entries.map(([s, tables]) => {
          const isActive = s === selectedSchema;
          return (
            <button
              key={s}
              onClick={() => onSelectSchema(s)}
              className={[
                "w-full rounded-lg border px-3 py-2 text-left text-sm transition",
                isActive ? "border-cyan-400 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-800",
              ].join(" ")}
            >
              <div className="font-semibold">{s}</div>
              <div className="text-xs text-slate-500">{tables.length} tables</div>
            </button>
          );
        })}
        {entries.length === 0 && <div className="text-xs text-slate-500">No schemas</div>}
      </div>
    </div>
  );
}
