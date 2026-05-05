"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  ReactFlow, Background, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState,
  type Connection, type Node, type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ChainNodeComponent from "./nodes/ChainNode";

export interface ChainData {
  version: string; name: string; model: string;
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
  onDeleteNode: (nodeId: string) => void;
  onAddNode: () => void;
  selectedNodeId: string | null;
}

interface HistoryEntry { nodes: Node[]; edges: Edge[]; }

export default function Canvas({
  chain, initialEdges, onChainChange, nodeStatuses,
  onNodeSelect, onNodeReRun, onDeleteNode, onAddNode, selectedNodeId,
}: CanvasProps) {
  const initialNodes: Node[] = (chain?.nodes ?? []).map((n, i) => ({
    id: n.id, type: "chainNode",
    position: { x: 250, y: i * 120 + 50 },
    data: { name: n.name, instruction: n.instruction, skill: n.skill,
      command: n.command, status: nodeStatuses[n.id] ?? "pending",
      onSelect: onNodeSelect, onReRun: onNodeReRun },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Undo/redo stacks
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const capturing = useRef(false);
  const skipRef = useRef(true); // skip first sync push

  const pushHistory = useCallback(() => {
    if (capturing.current) return;
    setHistory((prev) => {
      const entry = { nodes, edges };
      const next = prev.slice(0, historyIdx + 1);
      next.push(entry);
      return next.slice(-50);
    });
    setHistoryIdx((i) => Math.min(i + 1, 49));
  }, [nodes, edges, historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx < 0) return;
    capturing.current = true;
    const entry = history[historyIdx];
    setNodes(entry.nodes);
    setEdges(entry.edges);
    setHistoryIdx((i) => i - 1);
    // Sync to chain after undo
    setTimeout(() => {
      capturing.current = false;
      if (chain) {
        const updatedNodes = chain.nodes.map((n) => ({
          ...n,
          inputs: entry.edges.filter((e: Edge) => e.target === n.id).map((e: Edge) => e.source),
        }));
        onChainChange({ ...chain, nodes: updatedNodes });
      }
    }, 100);
  }, [history, historyIdx, setNodes, setEdges, chain, onChainChange]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    capturing.current = true;
    const entry = history[historyIdx + 1];
    setNodes(entry.nodes);
    setEdges(entry.edges);
    setHistoryIdx((i) => i + 1);
    setTimeout(() => {
      capturing.current = false;
      if (chain) {
        const updatedNodes = chain.nodes.map((n) => ({
          ...n,
          inputs: entry.edges.filter((e: Edge) => e.target === n.id).map((e: Edge) => e.source),
        }));
        onChainChange({ ...chain, nodes: updatedNodes });
      }
    }, 100);
  }, [history, historyIdx, setNodes, setEdges, chain, onChainChange]);

  // Sync nodes/edges when chain data changes
  useEffect(() => {
    skipRef.current = true;
    setNodes(initialNodes);
    setEdges(initialEdges);
    setHistory([]);
    setHistoryIdx(-1);
  }, [chain, nodeStatuses]);

  // Push history on any manual change (skip initial sync)
  useEffect(() => {
    if (skipRef.current) { skipRef.current = false; return; }
    pushHistory();
  }, [nodes.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
      else if ((e.metaKey || e.ctrlKey) && e.key === "y") { e.preventDefault(); redo(); }
      else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeId) { e.preventDefault(); onDeleteNode(selectedNodeId); }
      }
      else if (e.key === " " && selectedNodeId) { e.preventDefault(); onNodeReRun(selectedNodeId); }
      else if (e.key === "n") { e.preventDefault(); onAddNode(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, selectedNodeId, onDeleteNode, onNodeReRun, onAddNode]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, type: "smoothstep" }, eds));
      if (!chain) return;
      const updatedNodes = chain.nodes.map((n) => {
        const newInputs = edges.filter((e) => e.target === n.id).map((e) => e.source);
        if (connection.target === n.id) newInputs.push(connection.source);
        return { ...n, inputs: [...new Set(newInputs)] };
      });
      onChainChange({ ...chain, nodes: updatedNodes });
      pushHistory();
    },
    [edges, chain, setEdges, onChainChange, pushHistory]
  );

  const onNodeClick = useCallback(
    (_e: React.MouseEvent, node: Node) => { onNodeSelect(node.id); },
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
        <span style={{ display: "inline-block", width: 10, height: 18,
          background: "var(--text-primary)", animation: "blink 1s step-end infinite",
        }} />
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes} edges={edges}
      onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      onConnect={onConnect} onNodeClick={onNodeClick}
      nodeTypes={nodeTypes} fitView deleteKeyCode={["Delete", "Backspace"]}
      style={{ background: "var(--bg-canvas)" }}
    >
      <Background color="var(--border)" gap={20} />
      <Controls style={{ background: "var(--bg-node)", border: "1px solid var(--border)", borderRadius: 6 }} />
      <MiniMap style={{ background: "var(--bg-node)", border: "1px solid var(--border)" }} />
    </ReactFlow>
  );
}
