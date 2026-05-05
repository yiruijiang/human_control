"use client";

import { useState, useEffect } from "react";
import { listRuns } from "@/lib/api-client";

interface RunInfo {
  runId: string;
  chainFile: string;
  total: number;
  completed: number;
  startedAt: string;
}

interface HistoryPanelProps {
  onClose: () => void;
  onReRun: (runId: string) => void;
  onViewRun: (runId: string) => void;
}

export default function HistoryPanel({ onClose, onReRun, onViewRun }: HistoryPanelProps) {
  const [runs, setRuns] = useState<RunInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRuns()
      .then(setRuns)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (r: RunInfo) =>
    r.completed === r.total ? "var(--node-completed)" :
    runs.some((x) => x.runId === r.runId && r.completed < r.total) ? "var(--node-running)" :
    "var(--node-failed)";

  return (
    <div style={{
      position: "fixed", top: 48, right: 0, bottom: 0, width: 320, zIndex: 40,
      background: "var(--bg-node)", borderLeft: "1px solid var(--border)",
      fontFamily: "var(--font-ui)", display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "10px 12px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>History</span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 16 }}>×</button>
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {loading && <div style={{ padding: 12, color: "var(--text-secondary)", fontSize: 12 }}>Loading...</div>}
        {error && <div style={{ padding: 12, color: "var(--node-failed)", fontSize: 12 }}>{error}</div>}
        {!loading && runs.length === 0 && (
          <div style={{ padding: 12, color: "var(--text-secondary)", fontSize: 12 }}>No runs yet. Run a chain to see history.</div>
        )}
        {runs.map((r) => (
          <div
            key={r.runId}
            onClick={() => onViewRun(r.runId)}
            style={{
              padding: "8px 12px", borderBottom: "1px solid var(--border)", cursor: "pointer",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor(r) }} />
              <span style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 500 }}>
                {r.chainFile?.replace(/\.yaml$/, "") ?? r.runId}
              </span>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 10, display: "flex", justifyContent: "space-between" }}>
              <span>{r.runId}</span>
              <span>{r.completed}/{r.total} nodes</span>
            </div>
            {r.startedAt && (
              <div style={{ color: "var(--text-secondary)", fontSize: 10, marginTop: 2 }}>
                {new Date(r.startedAt).toLocaleString()}
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onReRun(r.runId); }}
              style={{
                marginTop: 4, background: "transparent", border: "1px solid var(--border)",
                color: "var(--text-secondary)", fontSize: 10, padding: "2px 8px",
                borderRadius: 3, cursor: "pointer",
              }}
            >
              Re-run
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
