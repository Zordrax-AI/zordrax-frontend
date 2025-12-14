import Image from "next/image";

export default function HomePage() {
  return (
    <main className="bg-slate-950 text-slate-100">

      {/* ================= HERO ================= */}
      <section className="relative h-[90vh] min-h-[700px] overflow-hidden">
        {/* Background video */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/marketing/videos/hero-poster.jpg"
        >
          <source src="/marketing/videos/hero.webm" type="video/webm" />
          <source src="/marketing/videos/hero.mp4" type="video/mp4" />
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-40">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-2 text-xs text-sky-400">
            ● Government · Agriculture · Health
          </span>

          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight">
            From Government Services
            <br />
            to Smart Agriculture
            <br />
            to Health Systems —
            <br />
            <span className="text-slate-300">
              we turn data into decisions.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-slate-300">
            End-to-end BI solutions with Azure, Databricks, Fabric & Power BI.
            We blend business analysis with modern data engineering.
          </p>

          <div className="mt-10 flex gap-4">
            <a
              href="/portal"
              className="rounded-md bg-gradient-to-r from-sky-400 to-violet-500 px-6 py-3 text-sm font-medium text-slate-900"
            >
              Start a Project
            </a>

            <a
              href="/about"
              className="rounded-md border border-slate-600 px-6 py-3 text-sm text-slate-200 hover:bg-slate-900"
            >
              Explore Services
            </a>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Trusted across NHS, UN, FMCG & agriculture supply chains
          </p>
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section className="mx-auto max-w-7xl px-6 py-20 grid gap-6 md:grid-cols-2">
        <Card
          title="Consultancy"
          desc="Partner-led BI strategy, discovery workshops, KPI design, governance and roadmaps tailored to public sector and agri/health use cases."
        />
        <Card
          title="Professional Services"
          desc="End-to-end delivery: Azure/Fabric platforms, Databricks pipelines, Power BI models & dashboards, training and handover."
        />
      </section>

      {/* ================= SKILLS + SECTORS ================= */}
      <section className="mx-auto max-w-7xl px-6 py-20 grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">
            Professional BI you can depend on
          </h2>
          <p className="mt-3 text-slate-400">
            We combine business analysis with modern data engineering so leaders get trusted, timely decisions.
          </p>

          <div className="mt-8 space-y-4">
            <Skill label="Power BI" value={97} />
            <Skill label="Data Warehousing" value={92} />
            <Skill label="Azure Stack" value={92} />
            <Skill label="MS Fabric" value={88} />
            <Skill label="Databricks" value={85} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8">
          <h3 className="text-lg font-semibold">Sectors we serve</h3>
          <ul className="mt-4 space-y-3 text-slate-400 text-sm">
            <li>• Government: service performance, fraud analytics, programme outcomes</li>
            <li>• Agriculture: grower dashboards, supply visibility, subsidy reporting</li>
            <li>• Health: population health, ICB flow, cost optimisation</li>
          </ul>
        </div>
      </section>

      {/* ================= METRICS ================= */}
      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <p className="text-xs text-slate-400">
          Trusted by public sector and supply-chain teams
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Metric value="£120k+" label="project savings delivered" />
          <Metric value="£250k" label="annual cost reduction achieved" />
          <Metric value="<6 weeks" label="BI accelerator to value" />
        </div>

        <div className="mt-10">
          <a
            href="/contact"
            className="rounded-md bg-gradient-to-r from-sky-400 to-violet-500 px-6 py-3 text-sm font-medium text-slate-900"
          >
            Book a free consultation
          </a>
        </div>
      </section>

      {/* ================= LOGOS ================= */}
      <section className="border-t border-slate-800 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-12 px-6 opacity-80">
          <Logo src="/marketing/logos/nhs.jpg" />
          <Logo src="/marketing/logos/unicc.jpg" />
          <Logo src="/marketing/logos/diageo.png" />
          <Logo src="/marketing/logos/amfresh.png" />
          <Logo src="/marketing/logos/greenyard.png" />
          <Logo src="/marketing/logos/ms.png" />
        </div>
      </section>
    </main>
  );
}

/* ================= COMPONENTS ================= */

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-3 text-sm text-slate-400">{desc}</p>
    </div>
  );
}

function Skill({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-1 h-2 rounded bg-slate-800">
        <div
          className="h-2 rounded bg-gradient-to-r from-sky-400 to-violet-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  );
}

function Logo({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt="Client logo"
      width={90}
      height={40}
      className="object-contain grayscale hover:grayscale-0 transition"
    />
  );
}
