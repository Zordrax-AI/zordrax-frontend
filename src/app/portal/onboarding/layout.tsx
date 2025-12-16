import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      <aside className="w-64 border-r border-slate-800 p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase text-slate-400">
          Onboarding
        </h2>

        <nav className="space-y-2 text-sm">
          <Link href="/portal/onboarding" className="block hover:text-white">
            Overview
          </Link>
          <Link
            href="/portal/onboarding/questions"
            className="block hover:text-white"
          >
            Questions
          </Link>
          <Link
            href="/portal/onboarding/recommend"
            className="block hover:text-white"
          >
            Recommendation
          </Link>
          <Link
            href="/portal/onboarding/deploy"
            className="block hover:text-white"
          >
            Deploy
          </Link>
          <Link
            href="/portal/onboarding/status"
            className="block hover:text-white"
          >
            Status
          </Link>
        </nav>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
