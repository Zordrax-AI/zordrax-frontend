"use client";

import { useState } from "react";

export default function JsonViewer({ data, title = "JSON" }: { data: any; title?: string }) {
  const [open, setOpen] = useState(true);
  if (data === undefined || data === null) return null;
  return (
    <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--card-2)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 text-left text-sm text-[color:var(--fg)]"
      >
        {open ? "▼" : "▶"} {title}
      </button>
      {open && (
        <pre className="max-h-80 overflow-auto px-3 pb-3 text-xs text-[color:var(--muted)]">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
