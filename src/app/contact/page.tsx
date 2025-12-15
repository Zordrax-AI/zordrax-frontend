export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">

      {/* ================= BACKGROUND VIDEO ================= */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/marketing/videos/light_flicker.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-950/85" />

      {/* Subtle glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-amber-400/20 blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-cyan-400/10 blur-[140px]" />
      </div>

      {/* ================= CONTENT ================= */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-32 grid gap-16 md:grid-cols-2 items-center">

        {/* LEFT — CONTACT FORM */}
        <div>
          <h1 className="text-3xl font-semibold">Contact</h1>
          <p className="mt-3 text-slate-400 max-w-md">
            Tell us about your data challenge and we’ll get back to you.
          </p>

          <form className="mt-8 space-y-5 max-w-md">
            <div>
              <label className="text-xs text-slate-400">Name</label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400">Message</label>
              <textarea
                rows={5}
                className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              className="rounded-md bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 px-6 py-3 text-sm font-semibold text-slate-950 hover:opacity-90 transition"
            >
              Send
            </button>
          </form>
        </div>

        {/* RIGHT — VISUAL PANEL */}
        <div className="relative hidden md:block">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <video
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src="/marketing/videos/light_flicker.mp4" type="video/mp4" />
            </video>

            {/* Glass overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          </div>
        </div>

      </div>
    </main>
  );
}
