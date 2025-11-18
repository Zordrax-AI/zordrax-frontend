"use client";

import { useState } from "react";
import { retryDeployment } from "@/lib/onboardingConsoleApi";

type RetryButtonProps = {
  sessionId: string;
};

export function RetryButton({ sessionId }: RetryButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRetry() {
    setLoading(true);
    try {
      const res = await retryDeployment(sessionId);
      setMessage(res.message || "Retry triggered.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Retry failed.";
      setMessage(message || "Retry failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleRetry}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Retrying…" : "Retry last failed deployment"}
      </button>
      {message && <p className="text-xs text-gray-600">{message}</p>}
    </div>
  );
}
