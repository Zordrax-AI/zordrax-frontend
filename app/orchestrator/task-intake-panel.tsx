"use client";

import { useEffect, useMemo, useState } from "react";
import { startAIBuild } from "../../lib/zordrax-ai-build-client";
import {
  QueuedBuildTask,
  clearTaskQueue,
  loadTaskQueue,
  parseTaskInput,
  queueTasks,
  saveTaskQueue,
} from "../../lib/zordrax-task-intake-store";

const EXAMPLE_TASK = {
  task_id: "ZA-ONBOARDING-001",
  title: "Build customer requirements capture module",
  objective:
    "Create the first customer onboarding module that captures business requirements, source systems, data volume, reporting needs, compliance needs, and preferred cloud platforms.",
  repo: "onboarding-repo",
  linked_repos: ["frontend-repo"],
  priority: "high",
  dependencies: [],
  deliverables: [
    "FastAPI schema for onboarding requirements",
    "POST /onboarding/requirements endpoint",
    "GET /onboarding/requirements/{run_id} endpoint",
    "Frontend requirements form",
    "Validation rules",
    "Unit tests",
    "PR summary"
  ],
  acceptance_criteria: [
    "Customer can submit onboarding requirements",
    "Requirements are validated before saving",
    "A run_id is generated",
    "Frontend form connects to backend",
    "Tests pass",
    "PR is created for human approval"
  ],
  agent_execution_mode: "proposal_only",
  human_approval_required: true,
  requested_by: "founder",
  environment: "dev"
};

function Badge({ value }: { value?: string | null }) {
  const text = value || "unknown";
  const lower = text.toLowerCase();
  const cls =
    lower.includes("released") || lower.includes("success") || lower.includes("completed")
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : lower.includes("failed") || lower.includes("error")
      ? "bg-red-100 text-red-800 border-red-300"
      : lower.includes("selected")
      ? "bg-blue-100 text-blue-800 border-blue-300"
      : "bg-amber-100 text-amber-800 border-amber-300";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>{text}</span>;
}

export default function TaskIntakePanel({ defaultTask }: { defaultTask?: string }) {
  const [raw, setRaw] = useState(JSON.stringify(EXAMPLE_TASK, null, 2));
  const [queue, setQueue] = useState<QueuedBuildTask[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("Ready to load AI Build Tasks.");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    setQueue(loadTaskQueue());
  }, []);

  useEffect(() => {
    saveTaskQueue(queue);
  }, [queue]);

  const stats = useMemo(() => {
    return {
      total: queue.length,
      held: queue.filter((x) => x.queue_status === "held").length,
      selected: Object.values(selected).filter(Boolean).length,
      released: queue.filter((x) => x.queue_status === "released").length,
      failed: queue.filter((x) => x.queue_status === "failed").length,
    };
  }, [queue, selected]);

  function addTasks() {
    try {
      const tasks = parseTaskInput(raw);
      if (!tasks.length) {
        setMessage("No tasks found.");
        return;
      }
      setQueue(queueTasks(queue, tasks));
      setMessage(`Loaded ${tasks.length} task(s) into holding queue.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not parse task JSON.");
    }
  }

  function toggle(queueId: string) {
    setSelected((items) => ({ ...items, [queueId]: !items[queueId] }));
  }

  function selectAllHeld() {
    const next: Record<string, boolean> = {};
    for (const item of queue) {
      if (item.queue_status === "held") next[item.queue_id] = true;
    }
    setSelected(next);
  }

  function removeTask(queueId: string) {
    setQueue((items) => items.filter((item) => item.queue_id !== queueId));
    setSelected((items) => {
      const next = { ...items };
      delete next[queueId];
      return next;
    });
  }

  async function releaseSelected() {
    const tasks = queue.filter((item) => selected[item.queue_id] && item.queue_status !== "released");
    if (!tasks.length) {
      setMessage("Select at least one held task to release.");
      return;
    }

    setBusy("release");
    setMessage(`Releasing ${tasks.length} task(s) sequentially...`);

    let nextQueue = [...queue];

    for (const task of tasks) {
      try {
        nextQueue = nextQueue.map((item) =>
          item.queue_id === task.queue_id ? { ...item, queue_status: "selected" as const } : item
        );
        setQueue(nextQueue);

        const result = await startAIBuild({
          task: `${task.title}\n\nObjective: ${task.objective}\n\nAcceptance Criteria:\n${(task.acceptance_criteria || []).map((x) => `- ${x}`).join("\n")}`,
          repo: task.repo,
          requested_by: task.requested_by || "founder",
          environment: task.environment || "dev",
          create_real_pr: task.agent_execution_mode === "autonomous_pr",
          trigger_validation: task.agent_execution_mode !== "proposal_only",
        });

        nextQueue = nextQueue.map((item) =>
          item.queue_id === task.queue_id
            ? {
                ...item,
                queue_status: "released" as const,
                released_at: new Date().toISOString(),
                build_id: result.build_id,
                run_id: result.run_id,
                release_status: result.status,
              }
            : item
        );
        setQueue(nextQueue);
      } catch (error) {
        nextQueue = nextQueue.map((item) =>
          item.queue_id === task.queue_id
            ? {
                ...item,
                queue_status: "failed" as const,
                error: error instanceof Error ? error.message : "Release failed",
              }
            : item
        );
        setQueue(nextQueue);
      }
    }

    setSelected({});
    setBusy("");
    setMessage("Release run completed.");
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-cyan-700">Task Intake</p>
          <h3 className="text-xl font-bold">AI Build Task Holding Queue</h3>
          <p className="mt-1 text-sm text-slate-500">
            Paste one task or a JSON array of tasks. Hold them here, review, then release selected tasks into the AI Build Runner.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge value={`total ${stats.total}`} />
          <Badge value={`held ${stats.held}`} />
          <Badge value={`selected ${stats.selected}`} />
          <Badge value={`released ${stats.released}`} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <textarea
          className="min-h-96 rounded-2xl border border-slate-300 bg-slate-50 p-4 font-mono text-xs"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
        />

        <div className="space-y-3">
          <button className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white" onClick={addTasks}>
            Add / Load Tasks to Holding Queue
          </button>

          <button
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold"
            onClick={() =>
              setRaw(
                JSON.stringify(
                  [
                    EXAMPLE_TASK,
                    {
                      ...EXAMPLE_TASK,
                      task_id: "ZA-REC-001",
                      title: "Build architecture recommendation engine",
                      objective: "Build the first recommendation engine for cloud, warehouse, ETL, BI, and governance selection.",
                      repo: "onboarding-repo",
                    },
                  ],
                  null,
                  2
                )
              )
            }
          >
            Load Example Bulk Task List
          </button>

          <button className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold" onClick={selectAllHeld}>
            Select All Held Tasks
          </button>

          <button className="w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50" disabled={!!busy} onClick={releaseSelected}>
            {busy ? "Releasing..." : "Release Selected to AI Build"}
          </button>

          <button
            className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700"
            onClick={() => {
              clearTaskQueue();
              setQueue([]);
              setSelected({});
              setMessage("Queue cleared.");
            }}
          >
            Clear Queue
          </button>

          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{message}</div>

          {defaultTask ? (
            <button
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold"
              onClick={() =>
                setRaw(
                  JSON.stringify(
                    {
                      ...EXAMPLE_TASK,
                      task_id: `ZA-CUSTOM-${Date.now()}`,
                      title: defaultTask,
                      objective: defaultTask,
                    },
                    null,
                    2
                  )
                )
              }
            >
              Use Current Cockpit Prompt
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200 p-4">
          <h4 className="font-bold">Holding Queue</h4>
        </div>

        <div className="divide-y divide-slate-200">
          {queue.length ? (
            queue.map((task) => (
              <div key={task.queue_id} className="grid gap-3 p-4 lg:grid-cols-[32px_1fr_160px]">
                <input
                  type="checkbox"
                  checked={!!selected[task.queue_id]}
                  disabled={task.queue_status === "released"}
                  onChange={() => toggle(task.queue_id)}
                />

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{task.title}</p>
                    <Badge value={task.queue_status} />
                    <Badge value={task.priority || "medium"} />
                    <Badge value={task.repo} />
                  </div>

                  <p className="mt-2 text-sm text-slate-600">{task.objective}</p>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{task.task_id}</span>
                    {task.build_id ? <span>build: {task.build_id}</span> : null}
                    {task.run_id ? <span>run: {task.run_id}</span> : null}
                    {task.release_status ? <span>status: {task.release_status}</span> : null}
                  </div>

                  {task.error ? <p className="mt-2 text-xs text-red-600">{task.error}</p> : null}
                </div>

                <div className="flex items-start justify-end">
                  <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold" onClick={() => removeTask(task.queue_id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-slate-500">No tasks in holding queue yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
