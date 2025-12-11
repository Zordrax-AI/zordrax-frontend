// src/components/ui/Button.tsx
"use client";

import Link from "next/link";
import clsx from "clsx";

export function Button({
  children,
  onClick,
  variant = "primary",
  className,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline";
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-4 py-2 rounded-lg text-sm font-semibold transition",
        variant === "primary"
          ? "bg-sky-600 text-white hover:bg-sky-500"
          : "border border-slate-600 text-slate-300 hover:bg-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* --------------------------------------------------
   LINK BUTTON (used everywhere in your app)
-------------------------------------------------- */
export function LinkButton({
  href,
  children,
  variant = "primary",
  className
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "px-4 py-2 rounded-lg text-sm font-semibold transition block text-center",
        variant === "primary"
          ? "bg-sky-600 text-white hover:bg-sky-500"
          : "border border-slate-600 text-slate-300 hover:bg-slate-800",
        className
      )}
    >
      {children}
    </Link>
  );
}

// BACKWARD COMPATIBILITY
Button.Link = LinkButton;
