"use client";

import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "default";
}

export function Button({ variant = "default", className = "", ...props }: ButtonProps) {
  const base =
    "px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150";

  const styles = {
    default: "bg-slate-700 hover:bg-slate-600 text-white",
    primary: "bg-sky-600 hover:bg-sky-500 text-white",
    outline: "border border-slate-600 text-slate-300 hover:bg-slate-700"
  };

  return <button {...props} className={`${base} ${styles[variant]} ${className}`} />;
}

Button.Link = function ButtonLink({
  href,
  variant = "default",
  children
}: {
  href: string;
  variant?: "primary" | "outline" | "default";
  children: React.ReactNode;
}) {
  const base =
    "block text-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150";

  const styles = {
    default: "bg-slate-700 hover:bg-slate-600 text-white",
    primary: "bg-sky-600 hover:bg-sky-500 text-white",
    outline: "border border-slate-600 text-slate-300 hover:bg-slate-700"
  };

  return (
    <Link href={href} className={`${base} ${styles[variant]}`}>
      {children}
    </Link>
  );
};
