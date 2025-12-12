// src/components/ui/Button.tsx
"use client";

import Link from "next/link";
import clsx from "clsx";

type ButtonVariant = "primary" | "outline" | "ghost";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-sky-600 text-white hover:bg-sky-500",
  outline: "border border-slate-600 text-slate-300 hover:bg-slate-800",
  ghost: "text-slate-400 hover:text-white hover:bg-slate-800/40"
};

export function Button({
  children,
  onClick,
  variant = "primary",
  className,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-4 py-2 rounded-lg text-sm font-semibold transition",
        VARIANT_STYLES[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* --------------------------------------------------
   LINK BUTTON (used across the application)
-------------------------------------------------- */
export function LinkButton({
  href,
  children,
  variant = "primary",
  className
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "px-4 py-2 rounded-lg text-sm font-semibold transition block text-center",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}

// BACKWARD COMPATIBILITY
Button.Link = LinkButton;
