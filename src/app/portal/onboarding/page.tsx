"use client";

import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

export default function OnboardingOverview() {
  const router = useRouter();

  async function start() {
    const res = await fetch(`${API}/api/onboarding/sessions`, { method: "POST" });
    const { session_id } = await res.json();
    router.push(`/portal/onboarding/questions?session=${session_id}`);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">AI-Driven Onboarding</h1>
      <button
        onClick={start}
        className="rounded bg-indigo-600 px-4 py-2 text-white"
      >
        Start onboarding
      </button>
    </div>
  );
}
