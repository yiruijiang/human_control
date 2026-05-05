"use client";

import { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ChainNodeComponent from "./nodes/ChainNode";

export interface ChainData {
  version: string;
  name: string;
  model: string;
  nodes: Array<{
    id: string; name: string; skill: string | null; command: string | null;
    instruction: string; inputs: string[]; model?: string; cache?: boolean;
  }>;
}

const nodeTypes = { chainNode: ChainNodeComponent };

interface CanvasProps {
  chain: ChainData | null;
  initialEdges: Edge[];
  onChainChange: (chain: ChainData) => void;
  nodeStatuses: Record<string, "pending" | "running" | "completed" | "failed">;
  onNodeSelect: (nodeId: string) => void;
  onNodeReRun: (nodeId: string) => void;
  selectedNodeId: string | null;
}

export default function Canvas({
  chain, initialEdges, onChainChange, nodeStatuses,
  onNodeSelect, onNodeReRun, selectedNodeId,
}: CanvasProps) {
  const initialNodes: Node[] = (chain?.nodes ?? []).map((n, i) => ({
    id: n.id,
    type: "chainNode",
    position: { x: 250, y: i * 120 + 50 },
    data: {
      name: n.name,
      instruction: n.instruction,
      skill: n.skill,
      command: n.command,
      status: nodeStatuses[n.id] ?? "pending",
      onSelect: onNodeSelect,
      onReRun: onNodeReRun,
    },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes/edges when chain data changes (NL init, open file, etc.)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [chain, nodeStatuses]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, type: "smoothstep" }, eds));
      // Sync back to chain data
      if (!chain) return;
      const updatedNodes = chain.nodes.map((n) => {
        const newInputs = edges
          .filter((e) => e.target === n.id)
          .map((e) => e.source);
        // Include the new connection
        if (connection.target === n.id) {
          newInputs.push(connection.source);
        }
        return { ...n, inputs: [...new Set(newInputs)] };
      });
      onChainChange({ ...chain, nodes: updatedNodes });
    },
    [edges, chain, setEdges, onChainChange]
  );

  const onNodeClick = useCallback(
    (_e: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [onNodeSelect]
  );

  if (!chain || chain.nodes.length === 0) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100%", width: "100%", flexDirection: "column", gap: 12,
        color: "var(--text-secondary)", fontFamily: "var(--font-mono)",
      }}>
        <span style={{ color: "var(--accent)", fontSize: 18 }}>
          human-control <span style={{ color: "var(--text-primary)" }}>~ $</span>
        </span>
        <span style={{ fontSize: 14, opacity: 0.6 }}>describe workflow</span>
        <span style={{
          display: "inline-block", width: 10, height: 18,
          background: "var(--text-primary)", animation: "blink 1s step-end infinite",
        }} />
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      fitView
      style={{ background: "var(--bg-canvas)" }}
    >
      <Background color="var(--border)" gap={20} />
      <Controls style={{ background: "var(--bg-node)", border: "1px solid var(--border)", borderRadius: 6 }} />
      <MiniMap style={{ background: "var(--bg-node)", border: "1px solid var(--border)" }} />
    </ReactFlow>
  );
}
