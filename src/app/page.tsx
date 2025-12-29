import Image from "next/image";

export default function HomePage() {
  return (
    <main className="bg-slate-950 text-slate-100">

      {/* ================= HERO ================= */}
      <section className="relative h-[90vh] min-h-[700px] overflow-hidden">

        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/marketing/analytics-intro.webm" type="video/webm" />
        </video>

        <div className="absolute inset-0 bg-slate-950/70" />

        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-cyan-500/20 blur-[120px]" />
          <div className="absolute top-20 right-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/20 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-amber-400/20 blur-[120px]" />
        </div>

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
          </p>

          <div className="mt-10 flex gap-4">
            <a
              href="/portal"
              className="rounded-md bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 px-6 py-3 text-sm font-semibold text-slate-950"
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
