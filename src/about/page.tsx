export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-semibold">
        About Zordrax-Analytica
      </h1>

      <p className="mt-6 text-lg text-slate-400">
        Zordrax-Analytica is a modular, AI-driven analytics platform designed
        to remove friction from enterprise data delivery.
      </p>

      <div className="mt-12 space-y-6 text-slate-400">
        <p>
          We unify infrastructure provisioning, ETL pipelines, governance,
          and reporting into a single DevOps-driven system.
        </p>

        <p>
          Unlike vendor-locked platforms, Zordrax-Analytica remains
          cloud-agnostic and tool-agnostic — allowing organizations to evolve
          without re-platforming.
        </p>

        <p>
          Our AI onboarding layer accelerates setup, while always keeping
          humans in the loop for compliance, cost control, and architectural clarity.
        </p>
      </div>
    </main>
  );
}
