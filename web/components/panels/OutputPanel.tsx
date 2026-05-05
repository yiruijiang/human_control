"use client";

import { useRef, useEffect } from "react";

interface OutputPanelProps {
  output: string;
  nodeName: string;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
  onClose: () => void;
}

export default function OutputPanel({ output, nodeName, status, error, onClose }: OutputPanelProps) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [output]);

  const statusDot: Record<string, string> = {
    pending: "var(--text-secondary)",
    running: "var(--node-running)",
    completed: "var(--node-completed)",
    failed: "var(--node-failed)",
  };

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: "var(--bg-node)", borderLeft: "1px solid var(--border)",
      fontFamily: "var(--font-ui)", overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 12px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", background: statusDot[status],
          }} />
          <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>
            {nodeName}
          </span>
          <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>
            {status}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent", border: "none", color: "var(--text-secondary)",
            cursor: "pointer", fontSize: 16, padding: "0 4px",
          }}
        >
          ×
        </button>
      </div>
      {error && (
        <div style={{
          padding: "8px 12px", background: "rgba(218,54,51,0.1)",
          color: "var(--node-failed)", fontSize: 12, borderBottom: "1px solid var(--border)",
        }}>
          {error}
        </div>
      )}
      <pre
        ref={ref}
        style={{
          flex: 1, margin: 0, padding: "12px", overflow: "auto",
          fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.5,
          color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-all",
        }}
      >
        {output || (status === "running" ? "Waiting for output..." : "No output")}
      </pre>
    </div>
  );
}
