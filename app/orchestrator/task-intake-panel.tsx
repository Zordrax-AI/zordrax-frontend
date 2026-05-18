"use client";

import { useMemo, useState } from "react";

type IntakeTask = {
  task_id: string;
  title: string;
  objective?: string;
  repo?: string;
  priority?: string;
  status?: string;
};

const EXAMPLE_TASK = `[
  {
    "task_id": "ZA-ONBOARDING-001",
    "title": "Build customer requirements capture module",
    "objective": "Create onboarding requirements capture flow",
    "repo": "onboarding-repo",
    "priority": "high"
  }
]`;

type Props = {
  defaultTask?: string;
};

export default function TaskIntakePanel({
  defaultTask = "",
}: Props) {
  const [payload, setPayload] = useState(
  defaultTask
    ? JSON.stringify(
        [
          {
            task_id: "ZA-AUTO-001",
            title: defaultTask,
            objective: defaultTask,
            repo: "onboarding-repo",
            priority: "high",
          },
        ],
        null,
        2
      )
    : EXAMPLE_TASK
);
  const [tasks, setTasks] = useState<IntakeTask[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("Ready to load AI Build Tasks.");

  function loadTasks() {
    try {
      const parsed = JSON.parse(payload);

      const incoming = Array.isArray(parsed) ? parsed : [parsed];

      const unique = incoming.filter(
        (task, index, self) =>
          index === self.findIndex((x) => x.task_id === task.task_id)
      );

      setTasks(unique);

      setMessage(
        `Loaded ${unique.length} unique task(s) into holding queue.`
      );
    } catch (err) {
      setMessage("Invalid JSON payload.");
    }
  }

  function toggleSelect(taskId: string) {
    setSelected((current) =>
      current.includes(taskId)
        ? current.filter((x) => x !== taskId)
        : [...current, taskId]
    );
  }

  function selectAll() {
    setSelected(tasks.map((x) => x.task_id));
  }

  function clearQueue() {
    setTasks([]);
    setSelected([]);
    setMessage("Holding queue cleared.");
  }

  function releaseSelected() {
    setMessage(
      `Released ${selected.length} task(s) to AI Build Runner.`
    );
  }

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      selected: selected.length,
      released: 0,
    };
  }, [tasks, selected]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-cyan-700">
            Task Intake
          </p>

          <h2 className="mt-1 text-3xl font-bold text-slate-950">
            AI Build Task Holding Queue
          </h2>

          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Load implementation tasks before release to the AI execution swarm.
            Tasks remain staged here until reviewed and approved for execution.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-slate-500">
              Total
            </p>
            <p className="mt-1 text-2xl font-bold">{stats.total}</p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-blue-700">
              Selected
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-900">
              {stats.selected}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-emerald-700">
              Ready
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">
              {tasks.length}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_420px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                Task Payload Input
              </h3>

              <button
                onClick={() => setPayload(EXAMPLE_TASK)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700"
              >
                Load Example
              </button>
            </div>

            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="h-[420px] w-full rounded-2xl border border-slate-300 bg-white p-4 font-mono text-sm outline-none"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-bold text-slate-900">
              Queue Status
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              {message}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-bold text-slate-950">
              Queue Actions
            </h3>

            <div className="mt-4 grid gap-3">
              <button
                onClick={loadTasks}
                className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white"
              >
                Load Tasks Into Queue
              </button>

              <button
                onClick={selectAll}
                className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-bold text-white"
              >
                Select All Tasks
              </button>

              <button
                onClick={releaseSelected}
                className="rounded-2xl bg-cyan-700 px-5 py-4 text-sm font-bold text-white"
              >
                Release Selected To AI Build
              </button>

              <button
                onClick={clearQueue}
                className="rounded-2xl border border-red-300 bg-white px-5 py-4 text-sm font-bold text-red-700"
              >
                Clear Queue
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="font-bold text-amber-900">
              Recommended Workflow
            </h3>

            <ol className="mt-3 space-y-2 text-sm text-amber-800">
              <li>1. Confirm active project</li>
              <li>2. Load Product Board tasks</li>
              <li>3. Push backlog to DevOps</li>
              <li>4. Stage tasks here</li>
              <li>5. Release selected tasks to AI</li>
              <li>6. Review PRs and approve</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-950">
            Holding Queue
          </h3>
        </div>

        {tasks.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No tasks currently staged in the holding queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                    Select
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                    Task ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                    Repo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                    Objective
                  </th>
                </tr>
              </thead>

              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.task_id}
                    className="border-b border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(task.task_id)}
                        onChange={() => toggleSelect(task.task_id)}
                        className="h-4 w-4"
                      />
                    </td>

                    <td className="px-4 py-4 font-mono text-sm font-bold">
                      {task.task_id}
                    </td>

                    <td className="px-4 py-4 font-semibold">
                      {task.title}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                        {task.repo || "unknown"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                        {task.priority || "normal"}
                      </span>
                    </td>

                    <td className="max-w-[500px] px-4 py-4 text-sm text-slate-600">
                      {task.objective}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
