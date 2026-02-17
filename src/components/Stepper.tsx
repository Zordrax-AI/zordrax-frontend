import Link from "next/link";

type Step = {
  key: string;
  label: string;
  description?: string;
  href?: string;
};

interface Props {
  steps: Step[];
  current: string;
}

export function Stepper({ steps, current }: Props) {
  return (
    <ol className="flex flex-wrap gap-4 md:gap-6 text-sm">
      {steps.map((step, idx) => {
        const isActive = step.key === current;
        const isPast = steps.findIndex((s) => s.key === current) > idx;
        const baseClasses =
          "flex items-center gap-2 px-3 py-2 rounded-md border transition-colors";
        const stateClasses = isActive
          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100"
          : isPast
          ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-100"
          : "border-[color:var(--border)] text-[color:var(--muted)]";
        const content = (
          <>
            <span className="text-xs font-semibold">{idx + 1}</span>
            <div className="flex flex-col">
              <span className="font-medium">{step.label}</span>
              {step.description && <span className="text-[11px] opacity-80">{step.description}</span>}
            </div>
          </>
        );
        return (
          <li key={step.key}>
            {step.href ? (
              <Link className={`${baseClasses} ${stateClasses}`} href={step.href}>
                {content}
              </Link>
            ) : (
              <div className={`${baseClasses} ${stateClasses}`}>{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
