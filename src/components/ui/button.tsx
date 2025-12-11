"use client";

import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import clsx from "clsx";
import Link from "next/link";

type Variant = "primary" | "ghost" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-xl border transition disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-sky-500 text-black border-sky-500 hover:bg-sky-400",
  outline: "bg-transparent border-slate-700 text-slate-100 hover:bg-slate-900",
  ghost: "bg-transparent border-transparent text-slate-300 hover:bg-slate-900"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className, children, ...props },
  ref
) {
  return (
    <button ref={ref} className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
});

export function LinkButton({
  href,
  children,
  variant = "outline",
  className
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link href={href} className={clsx(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
