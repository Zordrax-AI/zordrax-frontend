"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProductWorkItem, exampleProgram, loadBoard } from "../../lib/zordrax-product-board-store";

function Badge({ value }: { value: string | number }) {
  return <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{value}</span>;
}

export default function ProductBoardPanel() {
  const [items, setItems] = useState<ProductWorkItem[]>([]);
  useEffect(() => { const loaded = loadBoard(); setItems(loaded.length ? loaded : exampleProgram()); }, []);
  const stats = useMemo(() => ({
    epics: items.filter((x)=>x.type==="Epic").length,
    features: items.filter((x)=>x.type==="Feature").length,
    stories: items.filter((x)=>x.type==="Story").length,
    tasks: items.filter((x)=>x.type==="Task").length,
    prs: items.filter((x)=>x.status==="PRPending").length
  }), [items]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-cyan-700">Product Delivery</p>
          <h2 className="text-xl font-bold">Epic / Feature / Story / Task Board</h2>
          <p className="mt-1 text-sm text-slate-500">Define Zordrax SaaS scope, bulk-load backlog, sync DevOps, and release Tasks into AI Orchestrator.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge value={`epics ${stats.epics}`} /><Badge value={`features ${stats.features}`} /><Badge value={`stories ${stats.stories}`} /><Badge value={`tasks ${stats.tasks}`} /><Badge value={`PRs ${stats.prs}`} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Link className="rounded-2xl bg-slate-950 p-4 text-white" href="/product-board"><p className="font-bold">Product Board</p><p className="mt-1 text-sm text-slate-300">Hierarchy and roadmap</p></Link>
        <Link className="rounded-2xl bg-cyan-700 p-4 text-white" href="/product-board/load"><p className="font-bold">Bulk Load</p><p className="mt-1 text-sm text-cyan-100">Table, CSV, Excel, JSON</p></Link>
        <Link className="rounded-2xl bg-purple-700 p-4 text-white" href="/product-board/status"><p className="font-bold">Progress</p><p className="mt-1 text-sm text-purple-100">Completion status</p></Link>
        <Link className="rounded-2xl bg-amber-600 p-4 text-white" href="/product-board/approvals"><p className="font-bold">Approvals</p><p className="mt-1 text-sm text-amber-100">PRs waiting review</p></Link>
      </div>
    </section>
  );
}
