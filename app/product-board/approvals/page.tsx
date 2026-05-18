"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductWorkItem, loadBoard } from "../../../lib/zordrax-product-board-store";
import { getPendingApprovals } from "../../../lib/zordrax-product-board-client";

type Approval={id:string;title:string;repo:string;pr_url?:string;devops_url?:string;status:string;requested_by?:string};

export default function ProductBoardApprovalsPage(){
  const [approvals,setApprovals]=useState<Approval[]>([]);
  const [message,setMessage]=useState("Loaded local pending approvals.");
  useEffect(()=>{const local:ProductWorkItem[]=loadBoard();setApprovals(local.filter((x)=>x.status==="PRPending"||x.pr_url||x.devops_url).map((x)=>({id:x.id,title:x.title,repo:x.repo,pr_url:x.pr_url,devops_url:x.devops_url,status:x.status,requested_by:"founder"})))},[]);
  async function syncApprovals(){try{const result=await getPendingApprovals();setApprovals(result.approvals);setMessage("Synced pending approvals from backend.");}catch(e){setMessage(e instanceof Error?e.message:"Backend approvals endpoint not ready yet.");}}
  return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-7xl space-y-6">
    <header className="rounded-3xl bg-slate-950 p-6 text-white"><h1 className="text-3xl font-bold">Pending PR Approvals</h1><p className="mt-2 text-sm text-slate-300">Review GitHub/Vercel and Azure DevOps PRs waiting for human approval.</p><div className="mt-4 flex gap-2"><Link className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950" href="/product-board">Board</Link><Link className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950" href="/product-board/status">Status</Link><button className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950" onClick={syncApprovals}>Sync Approvals</button></div></header>
    <section className="rounded-2xl bg-white p-4 text-sm shadow-sm">{message}</section>
    <section className="grid gap-4">{approvals.length?approvals.map((approval)=><div key={approval.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-slate-500">{approval.id} • {approval.repo}</p><h2 className="mt-1 text-xl font-bold">{approval.title}</h2><p className="mt-1 text-sm text-slate-500">Status: {approval.status}</p></div><div className="flex flex-wrap gap-2">{approval.pr_url?<a className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white" href={approval.pr_url} target="_blank">Open PR</a>:null}{approval.devops_url?<a className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white" href={approval.devops_url} target="_blank">Open DevOps</a>:null}</div></div></div>):<div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm">No pending approvals found.</div>}</section>
  </div></main>
}
