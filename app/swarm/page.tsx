import Link from "next/link";
const cards = [
  { title: "Sandboxed Workers", href: "/swarm/sandboxes", desc: "View isolated agent execution sandboxes." },
  { title: "Auto-Remediation", href: "/swarm/remediation", desc: "Track fixes after QA or pipeline failures." },
  { title: "Confidence Scoring", href: "/swarm/confidence", desc: "Assess merge readiness before approval." },
  { title: "Merge Automation", href: "/swarm/merge", desc: "Human-gated merge and deploy control." },
];
export default function SwarmPage() {
  return <main className="min-h-screen bg-slate-50 p-6 text-slate-900"><div className="mx-auto max-w-7xl space-y-6"><header className="rounded-3xl bg-purple-950 p-6 text-white"><p className="text-sm text-purple-200">Phase C</p><h1 className="mt-2 text-3xl font-bold">Multi-Agent Swarm Execution</h1><p className="mt-2 text-sm text-purple-100">Planner, coder, QA, security, remediation and merge agents coordinated safely.</p></header><section className="grid gap-4 md:grid-cols-2">{cards.map((card) => <Link key={card.href} href={card.href} className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">{card.title}</h2><p className="mt-2 text-sm text-slate-600">{card.desc}</p></Link>)}</section></div></main>;
}
