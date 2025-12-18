"use client";

import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

export default function OnboardingOverview() {
  const router = useRouter();

  async function start() {
    const res = await fetch(`${API}/api/onboarding/sessions`, {
      method: "POST",
    });

    if (!res.ok) {
      alert("Failed to start onboarding session");
      return;
    }

    const data = await res.json();

    router.push(
      `/portal/onboarding/questions?session=${data.session_id}`
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">AI-Driven Onboarding</h1>
      <p className="text-slate-400">
        This guided flow collects requirements and generates an AI-recommended
        data platform.
      </p>

      <button
        onClick={start}
        className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
      >
        Start onboarding
      </button>
    </div>
  );
}
