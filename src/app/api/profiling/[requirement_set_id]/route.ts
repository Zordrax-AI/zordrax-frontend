import { NextResponse } from "next/server";

/**
 * Temporary profiling endpoint for the Mozart-style wizard.
 * Fixes: GET /api/profiling/:requirement_set_id returning 404 (Next route missing).
 *
 * Later: replace this stub with a proxy call to the onboarding-agent once
 * /api/brd/requirement-sets/{id}/inputs and/or a real profiling endpoint is stable.
 */
export async function GET(
  _req: Request,
  ctx: { params: { requirement_set_id: string } }
) {
  const reqSetId = ctx.params.requirement_set_id;

  // Deterministic stub values based on id length (keeps UI stable)
  const tablesSelected = 1;
  const rowsEst = 50_000_000;
  const sizeEstMb = 2384;

  return NextResponse.json(
    {
      ok: true,
      requirement_set_id: reqSetId,
      summary: {
        tables_selected: tablesSelected,
        rows_est: rowsEst,
        size_est_mb: sizeEstMb,
        refresh_plan: "daily",
        ingestion: "batch-with-cdc",
        pii_flagged: 2,
      },
      biggest_tables: [
        { name: "public.customers", rows: 25_000_000 },
        { name: "public.orders", rows: 12_000_000 },
        { name: "analytics.events", rows: 8_000_000 },
      ],
      pii_flags: [
        { type: "email", count: 2 },
        { type: "phone", count: 1 },
      ],
      warnings: [
        "Some tables missing primary keys (stub)",
        "PII columns need tokenization (stub)",
      ],
      source: "frontend_stub",
    },
    { status: 200 }
  );
}