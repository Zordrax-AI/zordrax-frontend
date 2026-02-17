import { ProfilingSummary } from "@/lib/types";

type Props = {
  summary: any; // accepting loose shape to match backend/debug payloads
};

export default function ProfilingSummaryCard({ summary }: Props) {
  if (!summary) return null;
  const totals = summary.totals || {};
  const biggest = summary.biggest_tables || [];
  const pii = summary.pii_summary || {};
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <div className="text-sm font-semibold text-slate-900">Profiling Summary</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <Stat label="Tables" value={totals.tables ?? "—"} />
        <Stat label="Rows est." value={totals.rows_estimate ? totals.rows_estimate.toLocaleString() : "—"} />
        <Stat
          label="Size est."
          value={
            totals.size_bytes_estimate
              ? `${Math.round(totals.size_bytes_estimate / 1024 / 1024)} MB`
              : "—"
          }
        />
        <Stat label="Refresh plan" value={summary.refresh_plan ?? "—"} />
        <Stat label="Ingestion" value={summary.ingestion_recommendation ?? "—"} />
        <Stat label="PII flagged" value={pii.flagged_tables ?? 0} />
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">Biggest tables</div>
        <div className="mt-2 space-y-1 text-sm">
          {biggest.length === 0 && <div className="text-slate-500 text-xs">No data</div>}
          {biggest.map((t: any) => (
            <div key={`${t.schema}.${t.name}`} className="flex justify-between">
              <span className="font-mono text-slate-800">
                {t.schema ? `${t.schema}.` : ""}
                {t.name}
              </span>
              <span className="text-slate-600">{t.row_estimate ? t.row_estimate.toLocaleString() : "—"} rows</span>
            </div>
          ))}
        </div>
      </div>

      {pii.flags && (
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">PII flags</div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-amber-700">
            {Object.entries(pii.flags).map(([k, v]) => (
              <span key={k} className="px-2 py-1 rounded-full bg-amber-50 border border-amber-200">
                {k}: {v as any}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-2">
      <div className="text-[11px] uppercase text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
