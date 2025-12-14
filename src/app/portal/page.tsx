import Link from "next/link";

export default function PortalHome() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Portal</h1>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Link href="/portal/onboarding" className="rounded border border-slate-800 p-6 hover:bg-slate-900">
          Start Onboarding
        </Link>

        <Link href="/portal/runs" className="rounded border border-slate-800 p-6 hover:bg-slate-900">
          Pipeline Runs
        </Link>

        <Link href="/portal/sessions" className="rounded border border-slate-800 p-6 hover:bg-slate-900">
          Sessions
        </Link>
      </div>
    </section>
  );
}
