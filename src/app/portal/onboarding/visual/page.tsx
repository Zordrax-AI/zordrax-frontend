"use client";

import React, { useCallback, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const BASE = process.env.NEXT_PUBLIC_ONBOARDING_API_URL;

// --------------------------------------------------------
// Block library — you can expand these anytime
// --------------------------------------------------------
const BLOCKS = [
  { type: "infrastructure", label: "Infrastructure", color: "#3b82f6" },
  { type: "etl", label: "ETL Pipeline", color: "#a855f7" },
  { type: "governance", label: "Governance", color: "#f59e0b" },
  { type: "bi", label: "BI Dashboard", color: "#10b981" },
];

// --------------------------------------------------------
export default function VisualDesigner() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [manifest, setManifest] = useState<any | null>(null);

  // ------------------------------------------------------
  // Add block to canvas
  // ------------------------------------------------------
  const addBlock = (block: any) => {
    const id = `${block.type}_${nodes.length + 1}`;
    const newNode = {
      id,
      type: "default",
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      data: { label: block.label, type: block.type },
      style: {
        background: block.color,
        padding: 10,
        color: "white",
        borderRadius: 8,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  // ------------------------------------------------------
  // Graph logic
  // ------------------------------------------------------
  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) =>
      nds.map((n) => {
        const change = changes.find((c: any) => c.id === n.id);
        return change ? { ...n, ...change } : n;
      })
    );
  }, []);

  const onEdgesChange = useCallback((changes: any) => {
    setEdges((eds) =>
      eds.filter((e) => !changes.some((c: any) => c.id === e.id))
    );
  }, []);

  const onNodeClick = (_e: any, node: any) => {
    setSelected(node);
  };

  // ------------------------------------------------------
  // Convert graph → manifest JSON
  // ------------------------------------------------------
  const generateManifest = async () => {
    const manifestJson = {
      infrastructure: nodes
        .filter((n) => n.data.type === "infrastructure")
        .map((n) => n.data),
      etl: nodes.filter((n) => n.data.type === "etl").map((n) => n.data),
      governance: nodes
        .filter((n) => n.data.type === "governance")
        .map((n) => n.data),
      bi: nodes.filter((n) => n.data.type === "bi").map((n) => n.data),
      connections: edges,
    };

    // Optional: send to backend manifest generator
    const res = await fetch(`${BASE}/ai/manifest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_name: "visual-project",
        infrastructure: manifestJson.infrastructure,
        etl: manifestJson.etl,
        governance: manifestJson.governance,
        bi: manifestJson.bi,
      }),
    });

    const data = await res.json();
    setManifest(data);
  };

  return (
    <div className="flex h-full">

      {/* --------------------------------------------- */}
      {/* LEFT PANEL — Block palette */}
      {/* --------------------------------------------- */}
      <div className="w-60 border-r border-slate-800 p-4 space-y-4 bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-300">
          Components
        </h2>

        {BLOCKS.map((b) => (
          <Card
            key={b.type}
            className="p-3 cursor-pointer hover:bg-slate-800"
            onClick={() => addBlock(b)}
          >
            {b.label}
          </Card>
        ))}

        <Button
          onClick={generateManifest}
          variant="primary"
          className="w-full mt-4"
        >
          Generate Manifest
        </Button>

        {manifest && (
          <>
            <p className="text-xs text-green-400 mt-4">
              Manifest created!
            </p>
            <pre className="text-xs bg-slate-800 p-2 rounded overflow-auto h-40">
              {JSON.stringify(manifest.manifest, null, 2)}
            </pre>
          </>
        )}
      </div>

      {/* --------------------------------------------- */}
      {/* CENTER PANEL — Canvas */}
      {/* --------------------------------------------- */}
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>

      {/* --------------------------------------------- */}
      {/* RIGHT PANEL — Property Editor */}
      {/* --------------------------------------------- */}
      <div className="w-64 border-l border-slate-800 p-4 bg-slate-900">
        <h2 className="text-sm font-semibold mb-2 text-slate-300">
          Properties
        </h2>

        {!selected && (
          <p className="text-xs text-slate-500">Select a block to edit.</p>
        )}

        {selected && (
          <div className="space-y-2">
            <p className="text-xs font-semibold">{selected.data.label}</p>

            <label className="text-xs text-slate-400">Node ID</label>
            <input
              className="w-full bg-slate-800 p-2 rounded text-xs"
              value={selected.id}
              readOnly
            />

            <label className="text-xs text-slate-400">Label</label>
            <input
              className="w-full bg-slate-800 p-2 rounded text-xs"
              value={selected.data.label}
              onChange={(e) => {
                const newLabel = e.target.value;
                setNodes((nds) =>
                  nds.map((n) =>
                    n.id === selected.id
                      ? { ...n, data: { ...n.data, label: newLabel } }
                      : n
                  )
                );
                setSelected((s: any) => ({
                  ...s,
                  data: { ...s.data, label: newLabel },
                }));
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
