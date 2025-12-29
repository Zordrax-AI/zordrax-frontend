"use client";

export function CancelRunButton({ runId }: { runId: string }) {
  const base = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

  const cancel = async () => {
    await fetch(`${base}/api/runs/${runId}/cancel`, { method: "POST" });
  };

  return (
    <button
      onClick={cancel}
      className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
    >
      Cancel run
    </button>
  );
}
