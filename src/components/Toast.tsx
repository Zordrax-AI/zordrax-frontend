"use client";

import { useEffect, useState } from "react";

export type ToastMessage = { id: string; text: string; tone?: "info" | "success" | "error" };

export default function Toast({ message }: { message?: ToastMessage | null }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (message) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2500);
      return () => clearTimeout(t);
    }
  }, [message]);

  if (!message || !visible) return null;
  const tone = message.tone || "info";
  const base = "fixed bottom-6 right-6 rounded-md px-4 py-2 shadow-lg text-sm border";
  const toneClass =
    tone === "success"
      ? "border-[color:var(--success)] bg-[color:var(--success-bg,rgba(16,185,129,0.12))] text-[color:var(--success)]"
      : tone === "error"
      ? "border-[color:var(--danger)] bg-[color:var(--danger-bg,rgba(244,63,94,0.12))] text-[color:var(--danger)]"
      : "border-[color:var(--border)] bg-[color:var(--card-2)] text-[color:var(--fg)]";
  return <div className={`${base} ${toneClass}`}>{message.text}</div>;
}
