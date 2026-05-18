"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { startAIBuild } from "../../lib/zordrax-ai-build-client";
import {
  FIELD_HELP,
  TaskTableRow,
  clearRows,
  exampleRows,
  loadRows,
  newRow,
  rowsFromDelimitedText,
  rowsFromObjects,
  saveRows,
  splitList,
  validateRow,
} from "../../lib/zordrax-task-table-store";

function Badge({ value }: { value?: string | number | boolean | null }) {
  const text = String(value ?? "unknown");
  const lower = text.toLowerCase();
  const cls = lower.includes("valid") || lower.includes("released") || lower.includes("ready")
    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
    : lower.includes("invalid") || lower.includes("failed")
    ? "bg-red-100 text-red-800 border-red-300"
    : "bg-slate-100 text-slate-700 border-slate-300";
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${cls}`}>{text}</span>;
}

function Help({ field }: { field: string }) {
  return <span className="ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold" title={FIELD_HELP[field]}>?</span>;
}

export default function TaskLoadTablePanel({ defaultTask }: { defaultTask?: string }) {
  const [rows, setRows] = useState<TaskTableRow[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [message, setMessage] = useState("Load tasks from table paste, CSV, or Excel.");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    const existing = loadRows();
    setRows(existing.length ? existing : exampleRows());
  }, []);

  useEffect(() => { saveRows(rows); }, [rows]);

  const stats = useMemo(() => ({
    total: rows.length,
    selected: rows.filter((r) => r.selected).length,
    valid: rows.filter((r) => r.status === "valid").length,
    released: rows.filter((r) => r.status === "released").length,
    failed: rows.filter((r) => r.status === "failed").length,
  }), [rows]);

  function update(id: string, patch: Partial<TaskTableRow>) {
    setRows((items) => items.map((row) => row.id === id ? { ...row, ...patch, status: "draft" } : row));
  }

  function validateAll() {
    setRows((items) => items.map(validateRow));
    setMessage("Rows validated.");
  }

  function importPaste() {
    try {
      const imported = rowsFromDelimitedText(pasteText);
      setRows((items) => [...imported, ...items]);
      setMessage(`Imported ${imported.length} row(s).`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Paste import failed.");
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase().split(".").pop();
    try {
      if (ext === "csv" || ext === "txt") {
        const imported = rowsFromDelimitedText(await file.text());
        setRows((items) => [...imported, ...items]);
        setMessage(`Imported ${imported.length} CSV row(s).`);
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const book = XLSX.read(buffer, { type: "array" });
        const sheet = book.Sheets[book.SheetNames[0]];
        const objects = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        const imported = rowsFromObjects(objects);
        setRows((items) => [...imported, ...items]);
        setMessage(`Imported ${imported.length} Excel row(s).`);
      } else {
        setMessage("Unsupported file. Use CSV, XLSX, or XLS.");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "File import failed.");
    } finally {
      e.target.value = "";
    }
  }

  async function releaseSelected() {
    let next = rows.map(validateRow);
    const selected = next.filter((r) => r.selected && r.status === "valid");
    if (!selected.length) {
      setRows(next);
      setMessage("No selected valid rows to release.");
      return;
    }
    setBusy("release");
    setRows(next);
    for (const task of selected) {
      try {
        const result = await startAIBuild({
          task: `${task.title}\n\nObjective: ${task.objective}\n\nDeliverables:\n${splitList(task.deliverables).map((x) => `- ${x}`).join("\n")}\n\nAcceptance Criteria:\n${splitList(task.acceptance_criteria).map((x) => `- ${x}`).join("\n")}`,
          repo: task.repo,
          requested_by: task.requested_by,
          environment: task.environment,
          create_real_pr: task.agent_execution_mode === "autonomous_pr",
          trigger_validation: task.agent_execution_mode !== "proposal_only",
        });
        next = next.map((r) => r.id === task.id ? { ...r, status: "released", message: result.status, build_id: result.build_id, run_id: result.run_id } : r);
        setRows(next);
      } catch (err) {
        next = next.map((r) => r.id === task.id ? { ...r, status: "failed", message: err instanceof Error ? err.message : "Release failed" } : r);
        setRows(next);
      }
    }
    setBusy("");
    setMessage("Release completed.");
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-cyan-700">Task Loader</p>
          <h2 className="text-2xl font-bold">Spreadsheet Task Load Page</h2>
          <p className="mt-1 text-sm text-slate-500">Paste from Excel, upload CSV/Excel, hover ? for field explanations, validate, then release selected tasks.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge value={`total ${stats.total}`} /><Badge value={`selected ${stats.selected}`} /><Badge value={`valid ${stats.valid}`} /><Badge value={`released ${stats.released}`} /><Badge value={`failed ${stats.failed}`} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div>
          <label className="text-sm font-bold">Paste table from Excel / CSV</label>
          <textarea className="mt-2 min-h-40 w-full rounded-2xl border bg-slate-50 p-4 font-mono text-xs" value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={"task_id\\ttitle\\tobjective\\trepo\\nZA-001\\tBuild module\\tCreate API and UI\\tonboarding-repo"} />
        </div>
        <div className="space-y-3">
          <button className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white" onClick={importPaste}>Import Pasted Table</button>
          <label className="block rounded-xl border px-4 py-3 text-center text-sm font-bold hover:bg-slate-50">Load CSV / Excel<input className="hidden" type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleFile} /></label>
          <button className="w-full rounded-xl border px-4 py-3 text-sm font-bold" onClick={() => setRows((r) => [newRow({ title: defaultTask || "", objective: defaultTask || "" }), ...r])}>Add Empty Row</button>
          <button className="w-full rounded-xl border px-4 py-3 text-sm font-bold" onClick={() => setRows(exampleRows())}>Load Example Rows</button>
          <button className="w-full rounded-xl border px-4 py-3 text-sm font-bold" onClick={validateAll}>Validate Rows</button>
          <button className="w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50" disabled={!!busy} onClick={releaseSelected}>{busy ? "Releasing..." : "Release Selected to AI Build"}</button>
          <button className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700" onClick={() => { clearRows(); setRows([]); }}>Clear All Rows</button>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{message}</div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border">
        <table className="min-w-[1800px] divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100"><tr>
            <th className="px-3 py-3">Use</th>
            {["task_id","title","objective","repo","linked_repos","priority","dependencies","deliverables","acceptance_criteria","agent_execution_mode","human_approval_required","requested_by","environment"].map((c) => <th key={c} className="px-3 py-3 text-left text-xs font-bold uppercase">{c}<Help field={c} /></th>)}
            <th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th>
          </tr></thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id} className={row.status === "invalid" ? "bg-red-50" : row.status === "released" ? "bg-emerald-50" : ""}>
                <td className="px-3 py-2"><input type="checkbox" checked={row.selected} onChange={(e) => update(row.id, { selected: e.target.checked })} /></td>
                <td className="px-3 py-2"><input className="w-44 rounded-lg border p-2" value={row.task_id} title={FIELD_HELP.task_id} onChange={(e) => update(row.id, { task_id: e.target.value })} /></td>
                <td className="px-3 py-2"><input className="w-64 rounded-lg border p-2" value={row.title} title={FIELD_HELP.title} onChange={(e) => update(row.id, { title: e.target.value })} /></td>
                <td className="px-3 py-2"><textarea className="h-20 w-80 rounded-lg border p-2" value={row.objective} title={FIELD_HELP.objective} onChange={(e) => update(row.id, { objective: e.target.value })} /></td>
                <td className="px-3 py-2"><select className="w-44 rounded-lg border p-2" value={row.repo} title={FIELD_HELP.repo} onChange={(e) => update(row.id, { repo: e.target.value })}>{["onboarding-repo","frontend-repo","infra-repo","etl-repo","governance-repo","bi-repo"].map((r) => <option key={r} value={r}>{r}</option>)}</select></td>
                <td className="px-3 py-2"><input className="w-52 rounded-lg border p-2" value={row.linked_repos} title={FIELD_HELP.linked_repos} onChange={(e) => update(row.id, { linked_repos: e.target.value })} /></td>
                <td className="px-3 py-2"><select className="w-32 rounded-lg border p-2" value={row.priority} title={FIELD_HELP.priority} onChange={(e) => update(row.id, { priority: e.target.value as TaskTableRow["priority"] })}>{["critical","high","medium","low"].map((p) => <option key={p} value={p}>{p}</option>)}</select></td>
                <td className="px-3 py-2"><input className="w-56 rounded-lg border p-2" value={row.dependencies} title={FIELD_HELP.dependencies} onChange={(e) => update(row.id, { dependencies: e.target.value })} /></td>
                <td className="px-3 py-2"><textarea className="h-20 w-72 rounded-lg border p-2" value={row.deliverables} title={FIELD_HELP.deliverables} onChange={(e) => update(row.id, { deliverables: e.target.value })} /></td>
                <td className="px-3 py-2"><textarea className="h-20 w-72 rounded-lg border p-2" value={row.acceptance_criteria} title={FIELD_HELP.acceptance_criteria} onChange={(e) => update(row.id, { acceptance_criteria: e.target.value })} /></td>
                <td className="px-3 py-2"><select className="w-44 rounded-lg border p-2" value={row.agent_execution_mode} title={FIELD_HELP.agent_execution_mode} onChange={(e) => update(row.id, { agent_execution_mode: e.target.value as TaskTableRow["agent_execution_mode"] })}>{["proposal_only","validation_only","autonomous_pr"].map((m) => <option key={m} value={m}>{m}</option>)}</select></td>
                <td className="px-3 py-2"><select className="w-28 rounded-lg border p-2" value={String(row.human_approval_required)} title={FIELD_HELP.human_approval_required} onChange={(e) => update(row.id, { human_approval_required: e.target.value === "true" })}><option value="true">true</option><option value="false">false</option></select></td>
                <td className="px-3 py-2"><input className="w-36 rounded-lg border p-2" value={row.requested_by} title={FIELD_HELP.requested_by} onChange={(e) => update(row.id, { requested_by: e.target.value })} /></td>
                <td className="px-3 py-2"><select className="w-28 rounded-lg border p-2" value={row.environment} title={FIELD_HELP.environment} onChange={(e) => update(row.id, { environment: e.target.value })}>{["dev","staging","prod"].map((x) => <option key={x} value={x}>{x}</option>)}</select></td>
                <td className="px-3 py-2"><Badge value={row.status} />{row.message ? <p className="max-w-64 text-xs text-slate-500">{row.message}</p> : null}{row.build_id ? <p className="break-all font-mono text-xs">build: {row.build_id}</p> : null}</td>
                <td className="px-3 py-2"><button className="rounded-lg border px-3 py-2 text-xs font-bold" onClick={() => setRows((items) => items.filter((x) => x.id !== row.id))}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="p-6 text-sm text-slate-500">No rows loaded yet.</p> : null}
      </div>
    </section>
  );
}
