"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { listConnectors, type Connector } from "@/lib/api";

type StatusFilter = "all" | "connected" | "error" | "unknown";

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await listConnectors();
      setConnectors(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load connectors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return connectors.filter((c) => {
      const status = normalizeStatus(c.status);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        term === "" ||
        c.name.toLowerCase().includes(term) ||
        (c.type || "").toLowerCase().includes(term) ||
        (c.id || "").toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [connectors, search, statusFilter]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6 text-[color:var(--fg)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Connectors</h1>
          <p className="text-sm text-[color:var(--muted)]">Manage and monitor data sources.</p>
        </div>
        <Link href="/portal/connectors/add">
          <Button variant="primary">Add Connector</Button>
        </Link>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold">Connector List</div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full sm:w-40 rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm text-[color:var(--fg)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            >
              <option value="all">All statuses</option>
              <option value="connected">Connected</option>
              <option value="error">Error</option>
              <option value="unknown">Unknown</option>
            </select>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or id"
              className="w-full sm:w-56 rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)] px-3 py-2 text-sm text-[color:var(--fg)] placeholder-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-[color:var(--danger)] bg-[color:var(--danger-bg,rgba(244,63,94,0.12))] px-3 py-2 text-sm text-[color:var(--danger)]">
            {error}
          </div>
        )}

        {!error && filtered.length === 0 && (
          <div className="rounded-md border border-dashed border-[color:var(--border)] bg-[color:var(--card-2)] px-4 py-6 text-sm text-[color:var(--muted)]">
            No connectors yet.
          </div>
        )}

        {filtered.length > 0 && (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-[color:var(--muted)]">
                <tr className="border-b border-[color:var(--border)]">
                  <th className="py-2 text-left">Name</th>
                  <th className="py-2 text-left">Type</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Last Discover</th>
                  <th className="py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[color:var(--border)]">
                    <td className="py-2">
                      <div className="font-medium text-[color:var(--fg)]">{c.name}</div>
                      <div className="text-xs text-[color:var(--muted)]">{c.id}</div>
                    </td>
                    <td className="py-2 text-[color:var(--muted)]">{c.type || "—"}</td>
                    <td className="py-2">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-2 text-[color:var(--muted)]">
                      {formatDate((c as any)?.last_discover_at || (c as any)?.updated_at)}
                    </td>
                    <td className="py-2">
                      <Link href={`/portal/connectors/${encodeURIComponent(c.id)}`}>
                        <Button variant="outline">Open</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function normalizeStatus(status: Connector["status"]): StatusFilter {
  const s = String(status || "").toLowerCase();
  if (s.includes("ok") || s.includes("ready") || s.includes("connected")) return "connected";
  if (s.includes("err") || s.includes("fail")) return "error";
  return "unknown";
}

function StatusBadge({ status }: { status: Connector["status"] }) {
  const norm = normalizeStatus(status);
  const tone =
    norm === "connected" ? "success" : norm === "error" ? "danger" : "default";
  const label =
    norm === "connected" ? "Connected" : norm === "error" ? "Error" : "Unknown";
  const base = "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border";
  const toneClass =
    tone === "success"
      ? "border-[color:var(--success)] text-[color:var(--success)] bg-[color:var(--success-bg,rgba(16,185,129,0.12))]"
      : tone === "danger"
      ? "border-[color:var(--danger)] text-[color:var(--danger)] bg-[color:var(--danger-bg,rgba(244,63,94,0.12))]"
      : "border-[color:var(--border)] text-[color:var(--muted)] bg-[color:var(--card-2)]";
  return (
    <span className={`${base} ${toneClass}`}>
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

function formatDate(value: any) {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}
