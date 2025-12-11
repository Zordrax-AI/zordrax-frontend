import { ReactNode } from "react";
import clsx from "clsx";

export function Badge({
  children,
  tone = "default"
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "error";
}) {
  const map: Record<string, string> = {
    default: "bg-slate-800 text-slate-100 border-slate-700",
    success: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
    warning: "bg-amber-900/60 text-amber-300 border-amber-700",
    error: "bg-rose-900/60 text-rose-300 border-rose-700"
  };
  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        map[tone]
      )}
    >
      {children}
    </span>
  );
}
