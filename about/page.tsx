// src/app/about/page.tsx
'use client';
import Navbar from '@/components/Navbar';

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <section className="space-y-6">
          <h1 className="text-3xl font-semibold">About Us</h1>
          <p className="text-slate-300 max-w-3xl">
            We build secure, budget-friendly analytics portals for Government,
            Agriculture, and Health: managed Postgres, API layer, and embedded BI
            (Power BI / Tableau / Looker Studio).
          </p>
          <ul className="text-slate-300 list-disc pl-6 space-y-2">
            <li>Private-by-default data platform (VNet + Private Endpoints)</li>
            <li>ADF/Airflow orchestration with monitoring &amp; alerting</li>
            <li>Rapid dashboards: HR, Finance, Supply Chain, Logistics</li>
          </ul>
        </section>
      </main>
    </>
  );
}
