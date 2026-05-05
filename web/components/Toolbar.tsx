"use client";

interface ToolbarProps {
  chainName: string;
  isRunning: boolean;
  hasUnsaved: boolean;
  onRunAll: () => void;
  onSave: () => void;
  onNLInit: () => void;
  onOpenChain: () => void;
  isSaving: boolean;
}

export default function Toolbar({
  chainName, isRunning, hasUnsaved, onRunAll, onSave, onNLInit, onOpenChain, isSaving,
}: ToolbarProps) {
  return (
    <div style={{
      height: 48, display: "flex", alignItems: "center", padding: "0 12px",
      background: "var(--bg-node)", borderBottom: "1px solid var(--border)",
      fontFamily: "var(--font-ui)", gap: 8,
    }}>
      <div style={{
        color: "var(--accent)", fontSize: 14, fontWeight: 700,
        fontFamily: "var(--font-mono)", marginRight: 8,
      }}>
        human-control
      </div>
      {chainName && (
        <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>
          {chainName}{hasUnsaved ? " *" : ""}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <button onClick={onOpenChain} style={ghostBtn}>
        Open
      </button>
      <button onClick={onNLInit} style={ghostBtn}>
        NL Init
      </button>
      <button onClick={onSave} disabled={isSaving} style={ghostBtn}>
        {isSaving ? "Saving..." : "Save"}
      </button>
      <button
        onClick={onRunAll}
        disabled={isRunning}
        style={{
          ...primaryBtn,
          opacity: isRunning ? 0.6 : 1,
          cursor: isRunning ? "not-allowed" : "pointer",
        }}
      >
        {isRunning ? "Running..." : "Run All"}
      </button>
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  background: "transparent", border: "1px solid var(--border)",
  color: "var(--text-primary)", padding: "4px 12px", borderRadius: 4,
  fontSize: 12, cursor: "pointer", fontFamily: "var(--font-ui)",
};

const primaryBtn: React.CSSProperties = {
  background: "var(--accent)", border: "none",
  color: "#fff", padding: "4px 16px", borderRadius: 4,
  fontSize: 12, fontWeight: 600, fontFamily: "var(--font-ui)",
};
