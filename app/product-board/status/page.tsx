"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProductWorkItem, loadBoard } from "../../../lib/zordrax-product-board-store";
import { getProductBoardStatus } from "../../../lib/zordrax-product-board-client";

function Card({title,value}:{title:string;value:string|number}){return <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>}

export default function ProductBoardStatusPage(){
  const [items,setItems]=useState<ProductWorkItem[]>([]);
  const [message,setMessage]=useState("Local status loaded.");
  useEffect(()=>setItems(loadBoard()),[]);
  const stats=useMemo(()=>{const total=items.length||1;const done=items.filter((x)=>x.status==="Done").length;return{total:items.length,tasks:items.filter((x)=>x.type==="Task").length,released:items.filter((x)=>x.status==="ReleasedToAI").length,pr:items.filter((x)=>x.status==="PRPending").length,done,pct:Math.round(done/total*100)}},[items]);
  async function syncLiveStatus(){try{const result=await getProductBoardStatus();setItems(result.items);setMessage("Synced live status from backend.");}catch(e){setMessage(e instanceof Error?e.message:"Backend status endpoint not ready yet.");}}
  return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-7xl space-y-6">
    <header className="rounded-3xl bg-slate-950 p-6 text-white"><h1 className="text-3xl font-bold">Product Completion Status</h1><p className="mt-2 text-sm text-slate-300">Visualize Zordrax SaaS project completion and AI delivery state.</p><div className="mt-4 flex gap-2"><Link className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950" href="/product-board">Board</Link><Link className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950" href="/product-board/load">Load</Link><button className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-bold text-white" onClick={syncLiveStatus}>Sync Live Status</button></div></header>
    <section className="grid gap-4 md:grid-cols-4"><Card title="Total Items" value={stats.total}/><Card title="Tasks" value={stats.tasks}/><Card title="Released to AI" value={stats.released}/><Card title="Completion" value={`${stats.pct}%`}/></section>
    <section className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{message}</p><div className="mt-4 h-5 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-emerald-500" style={{width:`${stats.pct}%`}}/></div></section>
    <section className="grid gap-4 md:grid-cols-3">{["Draft","Ready","PushedToDevOps","ReleasedToAI","InProgress","PRPending","Done","Blocked"].map((status)=><div key={status} className="rounded-2xl bg-white p-4 shadow-sm"><h2 className="font-bold">{status}</h2><div className="mt-3 space-y-2">{items.filter((x)=>x.status===status).slice(0,20).map((item)=><div key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="font-bold">{item.title}</p><p className="text-xs text-slate-500">{item.type} • {item.id}</p></div>)}</div></div>)}</section>
  </div></main>
}
