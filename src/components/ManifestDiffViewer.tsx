"use client";

import { useEffect, useState } from "react";
import {
  fetchManifest,
  acceptMergedManifest,
} from "@/lib/onboardingConsoleApi";

type ManifestDiffViewerProps = {
  sessionId: string;
};

export function ManifestDiffViewer({ sessionId }: ManifestDiffViewerProps) {
  const [aiManifest, setAiManifest] = useState<any | null>(null);
  const [manualManifest, setManualManifest] = useState<any | null>(null);
  const [mergedManifest, setMergedManifest] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [ai, manual] = await Promise.all([
          fetchManifest(sessionId, "ai"),
          fetchManifest(sessionId, "manual"),
        ]);
        if (cancelled) return;
        setAiManifest(ai);
        setManualManifest(manual);
        setMergedManifest({ ...(ai || {}), ...(manual || {}) });
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || "Failed to load manifests");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function handleSaveMerged() {
    if (!mergedManifest) return;
    setSaving(true);
    try {
      const res = await acceptMergedManifest(sessionId, mergedManifest);
      setMessage(res.message || "Merged manifest saved.");
    } catch (err: any) {
      setMessage(err.message || "Failed to save merged manifest.");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!aiManifest && !manualManifest) {
    return <p className="text-sm text-gray-500">Loading manifests…</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ManifestColumn title="AI Recommendation" manifest={aiManifest} />
      <ManifestColumn title="Manual Overrides" manifest={manualManifest} />
      <div className="flex flex-col gap-3">
        <ManifestColumn
          title="Merged Manifest (Effective)"
          manifest={mergedManifest}
          editable
          onChange={setMergedManifest}
        />
        <div className="mt-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={handleSaveMerged}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save merged manifest"}
          </button>
          {message && (
            <p className="text-xs text-gray-600">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

type ManifestColumnProps = {
  title: string;
  manifest: any;
  editable?: boolean;
  onChange?: (value: any) => void;
};

function ManifestColumn({
  title,
  manifest,
  editable,
  onChange,
}: ManifestColumnProps) {
  const value = manifest ? JSON.stringify(manifest, null, 2) : "// empty";

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h3>
      <textarea
        className="mt-2 flex-1 rounded border border-gray-200 bg-gray-50 p-2 font-mono text-xs leading-tight text-gray-800"
        defaultValue={value}
        readOnly={!editable}
        onChange={
          editable && onChange
            ? (e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  onChange(parsed);
                } catch {
                  // ignore parse errors while typing
                }
              }
            : undefined
        }
      />
    </div>
  );
}
