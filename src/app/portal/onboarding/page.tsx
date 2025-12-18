"use client";

import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_AGENT_BASE_URL!;

export default function OnboardingOverviewPage() {
  const router = useRouter();

  async function startOnboarding() {
    const res = await fetch(`${API}/api/onboarding/sessions`, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error("Failed to create onboarding session");
    }

    const { session_id } = await res.json();

    router.push(`/portal/onboarding/questions?session=${session_id}`);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">AI-Driven Onboarding</h1>
      <p className="text-slate-400">
        This guided flow will collect requirements and generate an AI-recommended data stack.
      </p>

      <button
        onClick={startOnboarding}
        className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
      >
        Start onboarding
      </button>
    </div>
  );
}
