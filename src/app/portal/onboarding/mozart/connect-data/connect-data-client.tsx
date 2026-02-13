"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { brdReadRequirementSet, brdSetConnector, listConnectors, type Connector } from "@/lib/api";
import { catalog, CatalogItem } from "./catalog";
import { SetupGuidePanel } from "./SetupGuidePanel";
import { AlreadyConnectedPanel } from "./AlreadyConnectedPanel";
import { ConnectorMarketplace } from "./ConnectorMarketplace";
import { CreateConnectorModal } from "./CreateConnectorModal";

const popular = catalog.filter((c) => c.popular);

export default function ConnectDataClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const requirementSetId = sp.get("requirement_set_id") ?? "";

  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState(catalog);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [attachedId, setAttachedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [skip, setSkip] = useState(false);
  const [modalItem, setModalItem] = useState<CatalogItem | null>(null);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      const v = search.toLowerCase();
      setFiltered(
        catalog.filter(
          (c) =>
            c.name.toLowerCase().includes(v) ||
            c.type.toLowerCase().includes(v) ||
            c.id.toLowerCase().includes(v)
        )
      );
    }, 160);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!requirementSetId) return;
    (async () => {
      await refreshAttached();
      await refreshConnectors();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirementSetId]);

  async function refreshAttached() {
    try {
      const rs = await brdReadRequirementSet(requirementSetId);
      setAttachedId(rs.connector_id || null);
    } catch {
      // ignore
    }
  }

  async function refreshConnectors() {
    setLoading(true);
    setError("");
    try {
      const data = await listConnectors();
      setConnectors(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load connectors");
    } finally {
      setLoading(false);
    }
  }

  async function attachConnector(id: string) {
    if (!requirementSetId) return;
    setLoading(true);
    setError("");
    try {
      await brdSetConnector(requirementSetId, id);
      setAttachedId(id);
      setSkip(false);
      await refreshConnectors();
    } catch (e: any) {
      setError(e?.message || "Attach failed");
    } finally {
      setLoading(false);
    }
  }

  function continueNext() {
    if (!requirementSetId) return;
    router.push(`/portal/onboarding/mozart/tables?requirement_set_id=${encodeURIComponent(requirementSetId)}`);
  }

  const canContinue = useMemo(() => !!attachedId || skip, [attachedId, skip]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <ConnectorMarketplace
            search={search}
            onSearch={setSearch}
            popular={popular}
            all={filtered}
            selectedId={modalItem?.id ?? null}
            onSelect={(i) => setModalItem(i)}
          />

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="sticky bottom-0 z-10 rounded-xl border border-slate-200 bg-white shadow-md px-4 py-3 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSkip(true)}>
              Skip
            </Button>
            <Button onClick={continueNext} disabled={!canContinue}>
              Continue
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <SetupGuidePanel />
          <AlreadyConnectedPanel
            connectors={connectors}
            attachedId={attachedId}
            loading={loading}
            onAttach={attachConnector}
            onRefresh={refreshConnectors}
          />
        </div>

        <CreateConnectorModal
          requirementSetId={requirementSetId}
          item={modalItem}
          onAttach={async (id) => {
            await attachConnector(id);
            await refreshAttached();
          }}
          onClose={() => setModalItem(null)}
          onError={(msg) => setError(msg)}
        />
      </div>
    </div>
  );
}
