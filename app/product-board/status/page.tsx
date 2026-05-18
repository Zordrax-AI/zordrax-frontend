"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLiveTaskStatus } from "../../../lib/zordrax-live-status-client";

type Item = {
  id: string;
  type: string;
  title: string;
  description?: string;
  parent_id?: string;
  repo?: string;
  priority?: string;
  status?: string;
  ai_run_id?: string;
  ai_build_id?: string;
  pr_url?: string;
  branch?: string;
  validation_status?: string;
  message?: string;
};

const STORAGE_KEYS = [
  "zordrax.product.board.items",
  "zordrax-product-board-items",
  "productBoardItems",
];

const COLUMNS = [
  "Draft",
  "Ready",
  "PushedToDevOps",
  "ReleasedToAI",
  "InProgress",
  "PRPending",
  "Done",
  "Blocked",
];

function readItems(): Item[] {
  if (typeof window === "undefined") return [];

  for (const key of STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      continue;
    }
  }

  return [];
}

function saveItems(items: Item[]) {
  localStorage.setItem("zordrax.product.board.items", JSON.stringify(items));
}

function normalizeStatus(item: Item): string {
  if (item.status === "PRPending") return "PRPending";
  if (item.status === "Done") return "Done";
  if (item.status === "Blocked" || item.status === "failed") return "Blocked";
  if (item.status === "PushedToDevOps") return "PushedToDevOps";
  if (item.status === "ReleasedToAI") return "ReleasedToAI";
  if (item.status === "Ready") return "Ready";
  return item.status || "Draft";
}

function runtimeToBoardStatus(runtimeStatus: string, prUrl?: string | null) {
  if (runtimeStatus === "failed") return "Blocked";
  if (runtimeStatus === "completed") return "Done";
  if (runtimeStatus === "pr_created" || prUrl) return "PRPending";
  if (["cloning", "branching", "patching", "committing", "creating_pr", "running", "queued"].includes(runtimeStatus)) {
    return "InProgress";
  }
  return "ReleasedToAI";
}

function badge(status: string) {
  if (status === "Done") return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (status === "PRPending") return "bg-purple-100 text-purple-800 ring-purple-200";
  if (status === "Blocked") return "bg-red-100 text-red-800 ring-red-200";
  if (status === "InProgress") return "bg-blue-100 text-blue-800 ring-blue-200";
  if (status === "ReleasedToAI") return "bg-cyan-100 text-cyan-800 ring-cyan-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export default function ProductBoardStatusPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState("Local status loaded.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setItems(readItems());
  }, []);

  const tasks = useMemo(() => items.filter((x) => x.type === "Task"), [items]);

  const stats = useMemo(() => {
    const total = items.length;
    const taskCount = tasks.length;
    const released = tasks.filter((x) => ["ReleasedToAI", "InProgress", "PRPending", "Done", "Blocked"].includes(normalizeStatus(x))).length;
    const done = tasks.filter((x) => normalizeStatus(x) === "Done").length;
    const completion = taskCount ? Math.round((done / taskCount) * 100) : 0;
    return { total, taskCount, released, done, completion };
  }, [items, tasks]);

  const grouped = useMemo(() => {
    const result: Record<string, Item[]> = {};
    for (const col of COLUMNS) result[col] = [];

    for (const item of items) {
      const status = normalizeStatus(item);
      if (!result[status]) result[status] = [];
      result[status].push(item);
    }

    return result;
  }, [items]);

  async function syncLiveStatus() {
    setBusy(true);
    setMessage("Syncing live runtime status...");

    let next = [...items];
    let checked = 0;
    let updated = 0;

    for (const item of next) {
      const runId = item.ai_run_id || item.ai_build_id;
      if (item.type !== "Task" || !runId) continue;

      checked += 1;

      try {
        const live = await getLiveTaskStatus(runId);
        const newStatus = runtimeToBoardStatus(live.status, live.pr_url);
        const oldStatus = item.status;

        item.status = newStatus;
        item.branch = live.branch || item.branch;
        item.validation_status = live.validation_status || item.validation_status;
        item.pr_url = live.pr_url || item.pr_url || undefined;
        item.message = `${live.status} | branch: ${live.branch || "pending"} | validation: ${live.validation_status || "pending"}`;

        if (oldStatus !== item.status || live.pr_url) updated += 1;
      } catch (error) {
        item.status = "Blocked";
        item.message = error instanceof Error ? error.message : "Live status sync failed";
        updated += 1;
      }
    }

    saveItems(next);
    setItems([...next]);
    setBusy(false);
    setMessage(`Live sync complete. Checked ${checked} run(s), updated ${updated} item(s).`);
  }

  function loadLocal() {
    const loaded = readItems();
    setItems(loaded);
    setMessage(`Loaded ${loaded.length} local board item(s).`);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-sm font-bold text-cyan-300">Zordrax Product Delivery</p>
          <h1 className="mt-2 text-3xl font-bold">Product Completion Status</h1>
          <p className="mt-2 text-sm text-slate-300">
            Sync AI runtime status, PR links, and task completion back into the Product Board.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/product-board" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950">
              Board
            </Link>
            <Link href="/product-board/load" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">
              Load
            </Link>
            <button
              onClick={syncLiveStatus}
              disabled={busy}
              className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "Syncing..." : "Sync Live Status"}
            </button>
            <button
              onClick={loadLocal}
              className="rounded-xl border border-white/30 px-4 py-2 text-sm font-bold text-white"
            >
              Reload Local
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Items</p>
            <p className="mt-1 text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tasks</p>
            <p className="mt-1 text-3xl font-bold">{stats.taskCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Released to AI</p>
            <p className="mt-1 text-3xl font-bold">{stats.released}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Done</p>
            <p className="mt-1 text-3xl font-bold">{stats.done}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Completion</p>
            <p className="mt-1 text-3xl font-bold">{stats.completion}%</p>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
          {message}
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stats.completion}%` }} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((column) => (
            <div key={column} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-bold">{column}</h2>

              <div className="mt-4 space-y-3">
                {(grouped[column] || []).map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 font-mono text-xs font-bold ring-1 ring-slate-200">
                        {item.id}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${badge(normalizeStatus(item))}`}>
                        {normalizeStatus(item)}
                      </span>
                    </div>

                    <h3 className="mt-3 font-bold">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-600">{item.type} • {item.repo || "no repo"}</p>

                    {item.ai_run_id && (
                      <p className="mt-2 font-mono text-xs text-slate-500">
                        Run: {item.ai_run_id}
                      </p>
                    )}

                    {item.branch && (
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        Branch: {item.branch}
                      </p>
                    )}

                    {item.validation_status && (
                      <p className="mt-1 text-xs text-slate-500">
                        Validation: {item.validation_status}
                      </p>
                    )}

                    {item.pr_url && (
                      <a
                        href={item.pr_url}
                        target="_blank"
                        className="mt-3 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                      >
                        Open PR
                      </a>
                    )}

                    {item.message && (
                      <p className="mt-3 rounded-xl bg-white p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                        {item.message}
                      </p>
                    )}
                  </div>
                ))}

                {!grouped[column]?.length && (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">
                    No items.
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
