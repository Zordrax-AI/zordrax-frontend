import { ProfilingSummary } from "@/lib/types";

interface Props {
  summary: ProfilingSummary | null;
}

export function SummaryCards({ summary }: Props) {
  if (!summary) return null;
  const totalSizeMb = summary.totals.size_bytes_estimate
    ? Math.round(summary.totals.size_bytes_estimate / 1024 / 1024)
    : null;
  const biggest = summary.biggest_tables || [];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card title="Tables">{summary.totals.tables}</Card>
      <Card title="Rows estimate">{summary.totals.rows_estimate ? summary.totals.rows_estimate.toLocaleString() : "—"}</Card>
      <Card title="Size estimate">{totalSizeMb ? `${totalSizeMb} MB` : "—"}</Card>
      <Card title="Biggest tables">
        <ul className="text-sm space-y-1">
          {biggest.slice(0, 3).map((t) => (
            <li key={`${t.schema || "public"}.${t.name}`}>
              {t.schema ? `${t.schema}.` : ""}
              {t.name} — {t.row_estimate ? `${t.row_estimate.toLocaleString()} rows` : "rows n/a"}
            </li>
          ))}
        </ul>
      </Card>
      <Card title="PII summary">
        {summary.pii_summary ? (
          <div className="text-sm">
            Flagged tables: {summary.pii_summary.flagged_tables}
            {summary.pii_summary.flags && (
              <div className="text-xs mt-1">Flags: {Object.entries(summary.pii_summary.flags).map(([k, v]) => `${k} (${v})`).join(", ")}</div>
            )}
          </div>
        ) : (
          <div className="text-sm text-[color:var(--muted)]">No PII info</div>
        )}
      </Card>
      <Card title="Recommendation">
        <div className="text-sm">
          Refresh: {summary.refresh_plan || "n/a"}
          <br />
          Ingestion: {summary.ingestion_recommendation || "n/a"}
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4 space-y-2">
      <div className="text-sm font-semibold text-[color:var(--fg)]">{title}</div>
      <div>{children}</div>
    </div>
  );
}
