"use client";

import { useEffect, useState } from "react";
import {
  fetchManifest,
  acceptMergedManifest,
  ManifestData,
  AcceptResponse,
} from "@/lib/onboardingConsoleApi";

// Props
type ManifestDiffViewerProps = {
  sessionId: string;
};

export function ManifestDiffViewer({ sessionId }: ManifestDiffViewerProps) {
  const [aiManifest, setAiManifest] = useState<ManifestData | null>(null);
  const [manualManifest, setManualManifest] = useState<ManifestData | null>(
    null
  );
  const [mergedManifest, setMergedManifest] = useState<ManifestData | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------
  // Load AI + manual manifests
  // -----------------------------------------------------
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

        // Combine them into the editable merged manifest
        setMergedManifest({
          ...(ai || {}),
          ...(manual || {}),
        });

        setError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Failed to load manifests.";
        setError(msg);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // -----------------------------------------------------
  // Save merged manifest
  // -----------------------------------------------------
  async function handleSaveMerged() {
    if (!mergedManifest) return;

    setSaving(true);
    try {
      const res: AcceptResponse = await acceptMergedManifest(
        sessionId,
        mergedManifest
      );

      // res.message is guaranteed by AcceptResponse
      setMessage(res.message);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save merged manifest.";
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------------------
  // UI Rendering
  // -----------------------------------------------------
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

// -----------------------------------------------------
// Manifest Column Component
// -----------------------------------------------------
type ManifestColumnProps = {
  title: string;
  manifest: ManifestData | null;
  editable?: boolean;
  onChange?: (value: ManifestData) => void;
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
                  const parsed = JSON.parse(e.target.value) as ManifestData;
                  onChange(parsed);
                } catch {
                  // ignore JSON parse errors while typing
                }
              }
            : undefined
        }
      />
    </div>
  );
}
