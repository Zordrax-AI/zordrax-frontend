"use client";

import { useState, ReactNode } from "react";
import clsx from "clsx";

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={clsx(
              "px-3 py-1 rounded-full text-xs",
              active === t.id
                ? "bg-sky-500 text-black"
                : "bg-slate-900 text-slate-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-2">
        {tabs.find((t) => t.id === active)?.content}
      </div>
    </div>
  );
}
