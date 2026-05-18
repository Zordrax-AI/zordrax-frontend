"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProductWorkItem, exampleProgram, loadBoard, saveBoard } from "../../lib/zordrax-product-board-store";
import { releaseItemToAI } from "../../lib/zordrax-product-board-client";

function Badge({ value }: { value: string | number }) {
  return <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{value}</span>;
}

export default function ProductBoardPage() {
  const [items, setItems] = useState<ProductWorkItem[]>([]);
  const [message, setMessage] = useState("Ready.");
  useEffect(() => { const loaded = loadBoard(); setItems(loaded.length ? loaded : exampleProgram()); }, []);
  useEffect(() => { saveBoard(items); }, [items]);
  const grouped = useMemo(() => ({
    epics: items.filter((x)=>x.type==="Epic").sort((a,b)=>a.sequence-b.sequence),
    features: items.filter((x)=>x.type==="Feature").sort((a,b)=>a.sequence-b.sequence),
    stories: items.filter((x)=>x.type==="Story").sort((a,b)=>a.sequence-b.sequence),
    tasks: items.filter((x)=>x.type==="Task").sort((a,b)=>a.sequence-b.sequence)
  }), [items]);

  async function releaseTask(task: ProductWorkItem) {
    try {
      setMessage(`Releasing ${task.id} to AI Orchestrator...`);
      const result = await releaseItemToAI(task);
      setItems((current)=>current.map((item)=>item.id===task.id ? {...item,status:"ReleasedToAI",ai_build_id:result.run_id,ai_run_id:result.run_id,pr_url:result.pr_url,message:`${result.status} | branch: ${result.branch} | validation: ${result.validation_status}`} : item));
      setMessage(`Released ${task.id}: ${result.status}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Release failed."); }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-sm text-cyan-200">Zordrax-Analytica</p>
          <h1 className="mt-2 text-3xl font-bold">Product Board</h1>
          <p className="mt-2 text-sm text-slate-300">Epics â†’ Features â†’ Stories â†’ Tasks â†’ AI Orchestrator.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950" href="/product-board/load">Bulk Load</Link>
            <Link className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950" href="/product-board/status">Status</Link>
            <Link className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950" href="/product-board/approvals">Approvals</Link>
            <Link className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-bold text-white" href="/orchestrator">Orchestrator</Link>
          </div>
        </header>
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Epics</p><p className="text-3xl font-bold">{grouped.epics.length}</p></div>
          <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Features</p><p className="text-3xl font-bold">{grouped.features.length}</p></div>
          <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Stories</p><p className="text-3xl font-bold">{grouped.stories.length}</p></div>
          <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Tasks</p><p className="text-3xl font-bold">{grouped.tasks.length}</p></div>
        </section>
        <section className="rounded-2xl bg-white p-4 text-sm shadow-sm">{message}</section>
        <section className="space-y-4">
          {grouped.epics.map((epic)=>(
            <div key={epic.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-2"><Badge value={epic.id}/><Badge value={epic.status}/><Badge value={epic.priority}/></div>
              <h2 className="mt-2 text-2xl font-bold">{epic.title}</h2><p className="mt-1 text-sm text-slate-600">{epic.description}</p>
              <div className="mt-5 space-y-4">
                {grouped.features.filter((f)=>f.parent_id===epic.id).map((feature)=>(
                  <div key={feature.id} className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                    <div className="flex flex-wrap gap-2"><Badge value={feature.id}/><Badge value={feature.status}/></div>
                    <h3 className="mt-2 text-lg font-bold">{feature.title}</h3><p className="text-sm text-slate-600">{feature.description}</p>
                    <div className="mt-4 space-y-3">
                      {grouped.stories.filter((s)=>s.parent_id===feature.id).map((story)=>(
                        <div key={story.id} className="rounded-2xl border border-purple-100 bg-white p-4">
                          <div className="flex flex-wrap gap-2"><Badge value={story.id}/><Badge value={story.status}/></div>
                          <h4 className="mt-2 font-bold">{story.title}</h4><p className="text-sm text-slate-600">{story.description}</p>
                          <div className="mt-3 grid gap-3">
                            {grouped.tasks.filter((t)=>t.parent_id===story.id).map((task)=>(
                              <div key={task.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap gap-2"><Badge value={task.id}/><Badge value={task.repo}/><Badge value={task.status}/></div>
                                    <p className="mt-2 font-bold">{task.title}</p><p className="text-sm text-slate-600">{task.description}</p>
                                    {task.ai_build_id ? <p className="mt-1 font-mono text-xs text-slate-500">AI Build: {task.ai_build_id}</p> : null}
                                  </div>
                                  <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white" onClick={()=>releaseTask(task)}>Release to AI</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

