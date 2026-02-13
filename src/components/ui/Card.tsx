// src/components/ui/Card.tsx

import { ReactNode, HTMLAttributes } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-sm text-[color:var(--fg)]",
        className
      )}
      {...props}   // <-- allows onClick, style, id, etc.
    >
      {children}
    </div>
  );
}
