import Link from "next/link";

export default function OnboardingOverview() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">AI-Driven Onboarding</h1>

      <p className="text-slate-400 max-w-xl">
        This guided flow will collect requirements, generate an AI-recommended
        data stack, and deploy it automatically.
      </p>

      <Link
        href="/portal/onboarding/questions"
        className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Start onboarding
      </Link>
    </div>
  );
}
