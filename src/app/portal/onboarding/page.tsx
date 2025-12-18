"use client";

import { useRouter } from "next/navigation";

export default function OnboardingOverviewPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">AI-Driven Onboarding</h1>

      <p className="text-slate-400 max-w-xl">
        This guided flow will collect requirements, generate an AI-recommended
        data stack, and deploy it automatically.
      </p>

      <button
        onClick={() => router.push("/portal/onboarding/questions")}
        className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Start onboarding
      </button>
    </div>
  );
}
