"use client";

import { Card } from "@/components/ui/Card";

type Props = {
  selectedKeys: string[];
  onClear: () => void;
};

export function SelectedTablesPanel({ selectedKeys, onClear }: Props) {
  return (
    <Card className="p-4 space-y-3 border border-slate-200 shadow-sm bg-white">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Selected tables</div>
        <button className="text-xs text-cyan-700" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="text-xs text-slate-500">{selectedKeys.length} selected</div>
      <div className="max-h-60 overflow-auto space-y-1 text-sm text-slate-800">
        {selectedKeys.map((k) => (
          <div key={k} className="rounded border border-slate-200 px-2 py-1 bg-slate-50 font-mono text-xs text-slate-700">
            {k}
          </div>
        ))}
        {selectedKeys.length === 0 && <div className="text-sm text-slate-500">No tables selected</div>}
      </div>
    </Card>
  );
}
