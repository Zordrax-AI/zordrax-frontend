'use client';

export default function Page() {
  return (
    <main
      style={{
        padding: 32,
        maxWidth: 960,
        margin: "0 auto",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "2.2rem", margin: "0 0 8px 0" }}>Zordrax-Analytica</h1>
        <p style={{ fontSize: "1.05rem", margin: 0, color: "#334" }}>
          Mozart-style onboarding to generate a plan-only run
        </p>
      </header>

      <section style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <a
          href="/onboarding/sources"
          style={{
            padding: "12px 18px",
            background: "#0f62fe",
            color: "white",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Start onboarding
        </a>
        <a
          href="/onboarding/plan"
          style={{
            padding: "12px 16px",
            border: "1px solid #0f62fe",
            color: "#0f62fe",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Go to Plan step
        </a>
      </section>

      <section>
        <h2 style={{ marginBottom: 12 }}>Onboarding steps</h2>
        <ol style={{ lineHeight: 1.7, paddingLeft: 20, color: "#223" }}>
          <li>Connect sources</li>
          <li>Define requirements</li>
          <li>Review recommendations</li>
          <li>Submit & approve</li>
          <li>Generate plan (safe)</li>
        </ol>
      </section>
    </main>
  );
}
