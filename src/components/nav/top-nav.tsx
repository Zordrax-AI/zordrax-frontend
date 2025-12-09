"use client";

import Link from "next/link";
import TenantSelector from "@/components/nav/tenant-selector";
import ThemeToggle from "@/components/theme/theme-toggle";

export default function TopNav() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-gray-900 border-b flex items-center justify-between px-6">
      {/* Logo + main links */}
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold text-blue-600">
          Zordrax Analytica
        </Link>

        <nav className="flex gap-4 text-sm text-gray-700 dark:text-gray-300">
          <Link href="/wizard/questions">AI Deploy</Link>
          <Link href="/wizard/deploy">Manual Deploy</Link>
          <Link href="/wizard/status">Status</Link>
          <Link href="/wizard/history">History</Link>
        </nav>
      </div>

      {/* Right side: tenant selector + theme */}
      <div className="flex items-center gap-3">
        <TenantSelector />
        <ThemeToggle />
      </div>
    </div>
  );
}
