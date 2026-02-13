"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/Input";
import { Logo } from "./Logo";
import type { CatalogItem } from "./catalog";

type Props = {
  search: string;
  onSearch: (v: string) => void;
  popular: CatalogItem[];
  all: CatalogItem[];
  selectedId: string | null;
  onSelect: (item: CatalogItem) => void;
};

export function ConnectorMarketplace({ search, onSearch, popular, all, selectedId, onSelect }: Props) {
  const classesTile =
    "rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-cyan-300";

  const filtered = useMemo(() => all, [all]); // filtering happens upstream via debounced search

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="text-lg font-semibold text-slate-900">Select the type of data source you want to connect</div>
        <div className="relative">
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search connectors..."
            className="pl-10 bg-white border-slate-300 focus:border-cyan-400"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>
      </div>

      <Section title="Most Popular">
        <TileGrid items={popular} selectedId={selectedId} onSelect={onSelect} classesTile={classesTile} />
      </Section>

      <Section title="All Connectors">
        <TileGrid items={filtered} selectedId={selectedId} onSelect={onSelect} classesTile={classesTile} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        {title}
      </div>
      {children}
    </div>
  );
}

function TileGrid({
  items,
  onSelect,
  selectedId,
  classesTile,
}: {
  items: CatalogItem[];
  onSelect: (item: CatalogItem) => void;
  selectedId: string | null;
  classesTile: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <button
            key={item.id}
            className={[
              classesTile,
              selected ? "border-cyan-500 ring-2 ring-cyan-100" : "",
              "flex items-center gap-3",
            ].join(" ")}
            onClick={() => onSelect(item)}
          >
            <Logo slug={item.logoSlug} alt={item.name} />
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-slate-900">{item.name}</div>
              <div className="text-xs text-slate-500">{item.type}</div>
            </div>
            {selected ? <span className="text-cyan-500 text-lg">✓</span> : null}
          </button>
        );
      })}
    </div>
  );
}
