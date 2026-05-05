"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";

export interface ChainNodeData {
  name: string;
  instruction: string;
  skill: string | null;
  command: string | null;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
  onSelect?: (id: string) => void;
  onReRun?: (id: string) => void;
}

function ChainNodeComponent({ data, id, selected }: NodeProps) {
  const nodeData = data as unknown as ChainNodeData;
  const { name, instruction, skill, command, status } = nodeData;
  const preview = instruction.slice(0, 80) + (instruction.length > 80 ? "..." : "");

  const statusColors: Record<string, { bg: string; border: string; dot: string }> = {
    pending:   { bg: "var(--bg-node)",              border: "var(--border)",        dot: "var(--text-secondary)" },
    running:   { bg: "var(--bg-node)",              border: "var(--node-running)",  dot: "var(--node-running)" },
    completed: { bg: "var(--bg-node)",              border: "var(--node-completed)",dot: "var(--node-completed)" },
    failed:    { bg: "rgba(218,54,51,0.08)",       border: "var(--node-failed)",   dot: "var(--node-failed)" },
  };

  const c = statusColors[status] ?? statusColors.pending;
  const icon = command ? ">" : skill ? "◆" : "○";

  return (
    <div
      className={`chain-node ${selected ? "ring-2 ring-[var(--accent)]" : ""}`}
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: "6px",
        padding: "10px 14px",
        minWidth: 200,
        maxWidth: 300,
        fontFamily: "var(--font-ui)",
        fontSize: "13px",
        cursor: "pointer",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: c.dot }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ color: c.dot, fontSize: 10 }}>{icon}</span>
        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 12 }}>{name}</span>
        <span
          style={{
            width: 8, height: 8, borderRadius: "50%", background: c.dot,
            marginLeft: "auto",
            animation: status === "running" ? "pulse 1s ease-in-out infinite" : "none",
          }}
        />
      </div>
      <div style={{ color: "var(--text-secondary)", fontSize: 11, lineHeight: 1.4 }}>
        {preview}
      </div>
      {status === "failed" && nodeData.error && (
        <div style={{ color: "var(--node-failed)", fontSize: 10, marginTop: 4 }}>
          {nodeData.error.slice(0, 60)}
        </div>
      )}
      {(status === "completed" || status === "failed") && (
        <div style={{ marginTop: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); nodeData.onReRun?.(id); }}
            style={{
              background: "transparent", border: `1px solid ${c.border}`,
              color: "var(--text-secondary)", fontSize: 10, padding: "2px 8px",
              borderRadius: "3px", cursor: "pointer",
            }}
          >
            Re-run from here
          </button>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: c.dot }} />
    </div>
  );
}

export default memo(ChainNodeComponent);
