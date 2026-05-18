"use client";
import { ChangeEvent, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";
import { FIELD_HELP, ProductWorkItem, clearBoard, exampleProgram, loadBoard, newWorkItem, rowsFromDelimitedText, rowsFromObjects, saveBoard, validateItem } from "../../../lib/zordrax-product-board-store";
import { pushItemsToDevOps, releaseItemToAI, syncItemsFromDevOps } from "../../../lib/zordrax-product-board-client";

function Help({ field }: { field: string }) { return <span className="ml-1 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold" title={FIELD_HELP[field]}>?</span>; }
function Badge({ value }: { value: string | number | boolean | undefined }) { return <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{String(value ?? "n/a")}</span>; }

export default function ProductBoardLoadPage() {
  const [items, setItems] = useState<ProductWorkItem[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [message, setMessage] = useState("Load Epics, Features, Stories, and Tasks.");
  const [busy, setBusy] = useState("");
  useEffect(()=>{ const loaded = loadBoard(); setItems(loaded.length ? loaded : exampleProgram()); },[]);
  useEffect(()=>{ saveBoard(items); },[items]);
  function update(oldId:string, patch:Partial<ProductWorkItem>){ setItems((current)=>current.map((item)=>item.id===oldId ? {...item,...patch,status:"Draft"} : item)); }
  function importPaste(){ try{ const imported = rowsFromDelimitedText(pasteText); setItems((current)=>[...imported,...current]); setMessage(`Imported ${imported.length} row(s).`);}catch(e){setMessage(e instanceof Error ? e.message : "Import failed.");}}
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if(!file) return; const ext = file.name.toLowerCase().split(".").pop();
    try {
      if(ext === "json"){ const parsed = JSON.parse(await file.text()); const imported = rowsFromObjects(Array.isArray(parsed) ? parsed : [parsed]); setItems((c)=>[...imported,...c]); setMessage(`Imported ${imported.length} JSON row(s).`);}
      else if(ext === "csv" || ext === "txt"){ const imported = rowsFromDelimitedText(await file.text()); setItems((c)=>[...imported,...c]); setMessage(`Imported ${imported.length} CSV row(s).`);}
      else if(ext === "xlsx" || ext === "xls"){ const buffer = await file.arrayBuffer(); const book = XLSX.read(buffer,{type:"array"}); const sheet = book.Sheets[book.SheetNames[0]]; const objects = XLSX.utils.sheet_to_json<Record<string,unknown>>(sheet,{defval:""}); const imported = rowsFromObjects(objects); setItems((c)=>[...imported,...c]); setMessage(`Imported ${imported.length} Excel row(s).`);}
      else setMessage("Unsupported file. Use CSV, XLSX, XLS, or JSON.");
    } catch(e){ setMessage(e instanceof Error ? e.message : "File import failed."); } finally { event.target.value = ""; }
  }
  async function pushSelectedToDevOps(){
    const selected = items.filter((x)=>x.selected); if(!selected.length) return setMessage("No selected items.");
    setBusy("devops");
    try { const result = await pushItemsToDevOps(selected); setItems((current)=>current.map((item)=>{ const match = result.items.find((x)=>x.id===item.id); return match ? {...item,status:"PushedToDevOps",devops_work_item_id:match.devops_work_item_id,devops_url:match.devops_url,message:match.message || match.status} : item;})); setMessage(`Pushed ${result.items.length} item(s) to DevOps.`);}
    catch(e){ setMessage(e instanceof Error ? e.message : "DevOps push failed. Backend endpoint may not exist yet."); } finally { setBusy("");}
  }
  async function syncFromDevOps(){ setBusy("sync"); try{ const result = await syncItemsFromDevOps(); setItems(result.items); setMessage(`Synced ${result.items.length} item(s) from DevOps.`);}catch(e){setMessage(e instanceof Error ? e.message : "DevOps sync failed. Backend endpoint may not exist yet.");} finally{setBusy("");}}
  async function releaseSelectedToAI(){
    const valid = items.map(validateItem); const selected = valid.filter((x)=>x.selected && x.type==="Task" && x.status==="Ready");
    if(!selected.length){ setItems(valid); return setMessage("No selected valid Task rows to release.");}
    setBusy("ai"); let next = valid;
    for(const item of selected){ try{ const result = await releaseItemToAI(item); next = next.map((x)=>x.id===item.id ? {...x,status:"ReleasedToAI",ai_build_id:result.run_id,ai_run_id:result.run_id,pr_url:result.pr_url,message:`${result.status} | branch: ${result.branch} | validation: ${result.validation_status}`}:x); setItems(next);}catch(e){ next = next.map((x)=>x.id===item.id ? {...x,status:"Blocked",message:e instanceof Error ? e.message : "AI release failed"}:x); setItems(next);}}
    setBusy(""); setMessage("AI release completed.");
  }
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-[1900px] space-y-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-sm text-cyan-200">Zordrax-Analytica</p><h1 className="mt-2 text-3xl font-bold">Bulk Load Product Work Items</h1>
          <p className="mt-2 text-sm text-slate-300">Paste, CSV, Excel, or JSON: Epic / Feature / Story / Task. Then push to DevOps or release Tasks to AI.</p>
          <div className="mt-4 flex gap-2"><Link className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950" href="/product-board">Board</Link><Link className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950" href="/product-board/status">Status</Link><Link className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950" href="/product-board/approvals">Approvals</Link></div>
        </header>
        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <textarea className="min-h-40 rounded-2xl border bg-white p-4 font-mono text-xs" value={pasteText} onChange={(e)=>setPasteText(e.target.value)} placeholder={"type\\tid\\ttitle\\tdescription\\tparent_id\\trepo\\nEpic\\tZA-EPIC-001\\tCustomer Onboarding\\t...\\t\\tonboarding-repo"} />
          <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
            <button className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white" onClick={importPaste}>Import Pasted Table</button>
            <label className="block rounded-xl border px-4 py-3 text-center text-sm font-bold hover:bg-slate-50">Load CSV / Excel / JSON<input className="hidden" type="file" accept=".csv,.txt,.xlsx,.xls,.json" onChange={importFile}/></label>
            <button className="w-full rounded-xl border px-4 py-3 text-sm font-bold" onClick={()=>setItems((x)=>[newWorkItem({type:"Task"}),...x])}>Add Row</button>
            <button className="w-full rounded-xl border px-4 py-3 text-sm font-bold" onClick={()=>setItems(exampleProgram())}>Load Example Program</button>
            <button className="w-full rounded-xl border px-4 py-3 text-sm font-bold" onClick={()=>setItems((x)=>x.map(validateItem))}>Validate</button>
            <button className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50" disabled={!!busy} onClick={pushSelectedToDevOps}>Push Selected to DevOps</button>
            <button className="w-full rounded-xl bg-purple-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50" disabled={!!busy} onClick={syncFromDevOps}>Sync from DevOps</button>
            <button className="w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50" disabled={!!busy} onClick={releaseSelectedToAI}>Release Selected Tasks to AI</button>
            <button className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700" onClick={()=>{clearBoard();setItems([]);}}>Clear Board</button>
            <div className="rounded-xl bg-slate-50 p-3 text-sm">{message}</div>
          </div>
        </section>
        <section className="overflow-x-auto rounded-2xl border bg-white">
          <table className="min-w-[2200px] divide-y text-sm"><thead className="bg-slate-100"><tr>
            <th className="px-3 py-3">Use</th>{["type","id","title","description","parent_id","sequence","repo","priority","dependencies","deliverables","acceptance_criteria","ai_execution_mode","human_approval_required"].map((h)=><th key={h} className="px-3 py-3 text-left text-xs font-bold uppercase">{h}{FIELD_HELP[h]?<Help field={h}/>:null}</th>)}<th className="px-3 py-3">Status</th><th className="px-3 py-3">Links</th><th className="px-3 py-3">Actions</th>
          </tr></thead><tbody className="divide-y">
            {items.map((item)=>(
              <tr key={item.id} className={item.status==="Blocked"?"bg-red-50":item.status==="ReleasedToAI"?"bg-emerald-50":""}>
                <td className="px-3 py-2"><input type="checkbox" checked={item.selected} onChange={(e)=>update(item.id,{selected:e.target.checked})}/></td>
                <td className="px-3 py-2"><select className="w-32 rounded-lg border p-2" value={item.type} onChange={(e)=>update(item.id,{type:e.target.value as ProductWorkItem["type"]})}>{["Epic","Feature","Story","Task"].map((x)=><option key={x}>{x}</option>)}</select></td>
                <td className="px-3 py-2"><input className="w-48 rounded-lg border p-2" value={item.id} onChange={(e)=>update(item.id,{id:e.target.value})}/></td>
                <td className="px-3 py-2"><input className="w-72 rounded-lg border p-2" value={item.title} onChange={(e)=>update(item.id,{title:e.target.value})}/></td>
                <td className="px-3 py-2"><textarea className="h-20 w-96 rounded-lg border p-2" value={item.description} onChange={(e)=>update(item.id,{description:e.target.value})}/></td>
                <td className="px-3 py-2"><input className="w-52 rounded-lg border p-2" value={item.parent_id} onChange={(e)=>update(item.id,{parent_id:e.target.value})}/></td>
                <td className="px-3 py-2"><input className="w-24 rounded-lg border p-2" type="number" value={item.sequence} onChange={(e)=>update(item.id,{sequence:Number(e.target.value)})}/></td>
                <td className="px-3 py-2"><select className="w-44 rounded-lg border p-2" value={item.repo} onChange={(e)=>update(item.id,{repo:e.target.value})}>{["onboarding-repo","zordrax-frontend","frontend-repo","infra-repo","etl-repo","governance-repo","bi-repo"].map((x)=><option key={x}>{x}</option>)}</select></td>
                <td className="px-3 py-2"><select className="w-32 rounded-lg border p-2" value={item.priority} onChange={(e)=>update(item.id,{priority:e.target.value as ProductWorkItem["priority"]})}>{["Critical","High","Medium","Low"].map((x)=><option key={x}>{x}</option>)}</select></td>
                <td className="px-3 py-2"><input className="w-56 rounded-lg border p-2" value={item.dependencies} onChange={(e)=>update(item.id,{dependencies:e.target.value})}/></td>
                <td className="px-3 py-2"><textarea className="h-20 w-72 rounded-lg border p-2" value={item.deliverables} onChange={(e)=>update(item.id,{deliverables:e.target.value})}/></td>
                <td className="px-3 py-2"><textarea className="h-20 w-72 rounded-lg border p-2" value={item.acceptance_criteria} onChange={(e)=>update(item.id,{acceptance_criteria:e.target.value})}/></td>
                <td className="px-3 py-2"><select className="w-44 rounded-lg border p-2" value={item.ai_execution_mode} onChange={(e)=>update(item.id,{ai_execution_mode:e.target.value as ProductWorkItem["ai_execution_mode"]})}>{["proposal_only","validation_only","autonomous_pr"].map((x)=><option key={x}>{x}</option>)}</select></td>
                <td className="px-3 py-2"><select className="w-28 rounded-lg border p-2" value={String(item.human_approval_required)} onChange={(e)=>update(item.id,{human_approval_required:e.target.value==="true"})}><option value="true">true</option><option value="false">false</option></select></td>
                <td className="px-3 py-2"><Badge value={item.status}/>{item.message?<p className="max-w-64 text-xs text-slate-500">{item.message}</p>:null}</td>
                <td className="px-3 py-2">{item.devops_url?<a className="text-blue-700 underline" href={item.devops_url} target="_blank">DevOps</a>:null}{item.ai_build_id?<p className="font-mono text-xs">AI: {item.ai_build_id}</p>:null}</td>
                <td className="px-3 py-2"><button className="rounded-lg border px-3 py-2 text-xs font-bold" onClick={()=>setItems((x)=>x.filter((y)=>y.id!==item.id))}>Remove</button></td>
              </tr>
            ))}
          </tbody></table>
        </section>
      </div>
    </main>
  );
}

