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

function ButtonInner(
  { variant = "primary", className, children, ...props }: ButtonProps,
  ref: React.Ref<HTMLButtonElement>
) {
  const cls = clsx(base, variants[variant], className);
  return (
    <button ref={ref} className={cls} {...props}>
      {children}
    </button>
  );
}

const ButtonComp = forwardRef<HTMLButtonElement, ButtonProps>(ButtonInner);
ButtonComp.displayName = "Button";

(ButtonComp as any).Link = function ButtonLink({
  href,
  children,
  variant = "outline"
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
}) {
  const cls = clsx(base, variants[variant]);
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
};

export { ButtonComp as Button };
