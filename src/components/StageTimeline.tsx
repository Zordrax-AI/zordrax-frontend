"use client";

type Stage =
  | "BRD Draft"
  | "Submitted"
  | "Approved"
  | "Planned"
  | "Awaiting approval"
  | "Infra Running"
  | "Infra Succeeded";

const stages: Stage[] = [
  "BRD Draft",
  "Submitted",
  "Approved",
  "Planned",
  "Awaiting approval",
  "Infra Running",
  "Infra Succeeded",
];

export default function StageTimeline({ current }: { current?: Stage | string }) {
  return (
    <ol className="flex flex-wrap gap-3 text-xs">
      {stages.map((stage) => {
        const active = stage === current;
        return (
          <li key={stage} className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                active ? "bg-[color:var(--accent)]" : "bg-[color:var(--border)]"
              }`}
            />
            <span className={active ? "text-[color:var(--accent)] font-semibold" : "text-[color:var(--muted)]"}>
              {stage}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
