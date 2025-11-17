"use client";

import Link from "next/link";
import { ReactNode } from "react";

type ConsoleShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function ConsoleShell({ title, subtitle, children, actions }: ConsoleShellProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            Zordrax Onboarding Console
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </header>

      <nav className="flex flex-wrap gap-2 text-xs text-gray-500">
        <Link href="/">Home</Link>
        <span>•</span>
        <Link href="/wizard">AI</Link>
        <span>•</span>
        <Link href="/manual">Manual</Link>
        <span>•</span>
        <Link href="/merge">Merge</Link>
        <span>•</span>
        <Link href="/governance">Governance</Link>
        <span>•</span>
        <Link href="/deployments">Deploy</Link>
        <span>•</span>
        <Link href="/history">History</Link>
      </nav>

      <section className="mt-4 flex-1">{children}</section>
    </main>
  );
}
