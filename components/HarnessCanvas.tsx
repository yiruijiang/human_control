"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useStore } from "@/store";
import { AgentNode } from "./AgentNode";
import type { Agent, Harness, HarnessNode } from "@/types";
import { Download, Save, Plus, Trash2 } from "lucide-react";

const NODE_TYPES = { agentNode: AgentNode };

function toFlowNodes(harnessNodes: HarnessNode[], agents: Agent[]): Node[] {
  return harnessNodes.map((hn) => {
    const agent = agents.find((a) => a.id === hn.agentId);
    if (!agent) return null;
    return {
      id: hn.id,
      type: "agentNode",
      position: hn.position,
      data: {
        agent,
        skillCount: agent.equippedSkills.length,
      },
    };
  }).filter(Boolean) as Node[];
}

function toFlowEdges(harnessEdges: Harness["edges"]): Edge[] {
  return harnessEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: true,
    style: { stroke: "#7c3aed", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#7c3aed" },
    labelStyle: { fill: "#94a3b8", fontSize: 10 },
    labelBgStyle: { fill: "#1a1a35", fillOpacity: 0.8 },
  }));
}

interface HarnessCanvasProps {
  harness: Harness;
}

export function HarnessCanvas({ harness }: HarnessCanvasProps) {
  const { agents, updateHarnessNodes, updateHarnessEdges } = useStore();
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  const initialNodes = useMemo(() => toFlowNodes(harness.nodes, agents), [harness.nodes, agents]);
  const initialEdges = useMemo(() => toFlowEdges(harness.edges), [harness.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        animated: true,
        style: { stroke: "#7c3aed", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#7c3aed" },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const handleSave = () => {
    const hnodes: HarnessNode[] = nodes.map((n) => ({
      id: n.id,
      agentId: (n.data as { agent: Agent }).agent.id,
      position: n.position,
      config: {},
    }));
    const hedges = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: typeof e.label === "string" ? e.label : undefined,
    }));
    updateHarnessNodes(harness.id, hnodes);
    updateHarnessEdges(harness.id, hedges);
  };

  const handleExport = () => {
    const data = {
      id: harness.id,
      name: harness.name,
      nodes: nodes.map((n) => ({
        id: n.id,
        agentId: (n.data as { agent: Agent }).agent.id,
        position: n.position,
      })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${harness.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addAgentToCanvas = (agent: Agent) => {
    const newNode: Node = {
      id: `n-${agent.id}-${Date.now()}`,
      type: "agentNode",
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data: { agent, skillCount: agent.equippedSkills.length },
    };
    setNodes((ns) => [...ns, newNode]);
    setShowAgentPicker(false);
  };

  return (
    <div className="relative w-full h-full" style={{ background: "var(--bg-base)" }}>
      {/* Toolbar */}
      <div
        className="absolute top-4 left-4 z-10 flex items-center gap-2"
        style={{ zIndex: 10 }}
      >
        <button
          onClick={() => setShowAgentPicker(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
          style={{
            background: "rgba(124, 58, 237, 0.2)",
            color: "#a78bfa",
            border: "1px solid rgba(124, 58, 237, 0.4)",
          }}
        >
          <Plus size={12} /> Add Agent
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
          style={{
            background: "rgba(6, 182, 212, 0.15)",
            color: "var(--accent-cyan)",
            border: "1px solid rgba(6, 182, 212, 0.3)",
          }}
        >
          <Save size={12} /> Save
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors"
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-default)",
          }}
        >
          <Download size={12} /> Export
        </button>
      </div>

      {/* React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode="Backspace"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.06)"
        />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const d = node.data as { agent?: Agent };
            return d.agent?.color ?? "#7c3aed";
          }}
          maskColor="rgba(13,13,26,0.7)"
        />
      </ReactFlow>

      {/* Agent picker modal */}
      {showAgentPicker && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowAgentPicker(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-80 rounded-xl p-4 max-h-96 overflow-y-auto"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-active)",
            }}
          >
            <div className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>
              Add Agent to Canvas
            </div>
            <div className="flex flex-col gap-1.5">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => addAgentToCanvas(agent)}
                  className="flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${agent.color}33`,
                  }}
                >
                  <span className="text-xl">{agent.icon}</span>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {agent.name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {agent.category}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
