import Image from "next/image";

export default function HomePage() {
  return (
    <main className="bg-slate-950 text-slate-100">
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

        <div className="relative z-10 mx-auto max-w-7xl px-6 pt-40">
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight text-white">
            From Government Services to Smart Agriculture —
            <span className="block bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
              we turn data into decisions.
            </span>
          </h1>

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
    </main>
  );
}
