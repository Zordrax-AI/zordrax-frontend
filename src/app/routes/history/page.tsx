"use client";

import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { SessionHistoryTable } from "@/components/SessionHistoryTable";


export default function HistoryPage() {
  return (
    <ConsoleShell
      title="Onboarding History"
      subtitle="Browse and reopen AI + Manual onboarding sessions."
    >
      <SessionHistoryTable />
    </ConsoleShell>
  );
}