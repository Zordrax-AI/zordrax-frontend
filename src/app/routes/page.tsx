import Link from "next/link";

const actions = [
  {
    href: "/wizard",
    title: "AI Deploy Architecture",
    description: "Let the AI orchestrator provision the recommended architecture.",
  },
  {
    href: "/manual",
    title: "Manual Deploy",
    description: "Trigger a manual deployment run with your curated configuration.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16">
      <section className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Zordrax Analytica
        </p>
        <h1 className="mt-4 text-4xl font-bold text-gray-900">
          Deploy adaptive data infrastructure in minutes.
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Choose between AI-guided orchestration or a manual run. Both paths connect to the existing
          onboarding backend.
        </p>
      </section>

      <section className="grid w-full gap-6 md:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">Start here</p>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900">{action.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{action.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
