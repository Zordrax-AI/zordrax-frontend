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
        >
          <source src="/marketing/analytics-intro.webm" type="video/webm" />
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-slate-950/70" />

        {/* Aurora / rainbow glow */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-cyan-500/20 blur-[120px]" />
          <div className="absolute top-20 right-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/20 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-amber-400/20 blur-[120px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-40">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-4 py-2 text-xs text-cyan-300">
            ● Government · Agriculture · Health
          </span>

          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight text-white">
            From Government Services
            <br />
            to Smart Agriculture
            <br />
            to Health Systems —
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
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
              className="rounded-md bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg hover:opacity-90 transition"
            >
              Start a Project
            </a>

            <a
              href="/about"
              className="rounded-md border border-white/30 px-6 py-3 text-sm text-white hover:bg-white/10"
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
