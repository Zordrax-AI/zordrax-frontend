import { ReactNode } from "react";
import clsx from "clsx";

export function Card({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
