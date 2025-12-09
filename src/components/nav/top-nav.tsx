"use client";

import Link from "next/link";
import TenantSelector from "@/components/tenant-selector";

export default function TopNav() {
  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50 h-16 flex items-center px-6 justify-between">
      {/* Left */}
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-semibold text-blue-600">
          Zordrax Analytica
        </Link>

        <nav className="flex gap-6 text-sm text-gray-700">
          <Link href="/wizard/questions">AI Deploy</Link>
          <Link href="/wizard/deploy">Manual Deploy</Link>
          <Link href="/wizard/status">Status</Link>
          <Link href="/wizard/history">History</Link>
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <TenantSelector />
      </div>
    </div>
  );
}
