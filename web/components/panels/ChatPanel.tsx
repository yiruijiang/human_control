"use client";

import { useState, useRef, useEffect } from "react";

interface ChatPanelProps {
  onClose: () => void;
  onApplyYaml: (yaml: string) => void;
  currentYaml: () => string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  yaml?: string;
}

export default function ChatPanel({ onClose, onApplyYaml, currentYaml }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/refine-chain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentYaml: currentYaml(), instruction: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setMessages((prev) => [...prev, { role: "assistant", content: `Updated chain (attempt ${data.attempts})`, yaml: data.yaml }]);
      onApplyYaml(data.yaml);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 240, right: 0, zIndex: 50,
      background: "var(--bg-node)", borderTop: "1px solid var(--border)",
      fontFamily: "var(--font-ui)", maxHeight: "40vh", display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "6px 12px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600 }}>Refine</span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 16 }}>×</button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "8px 12px", minHeight: 60 }}>
        {messages.length === 0 && (
          <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>
            Describe changes: "add a validation step", "change analyze to use deepseek", "split report into two nodes"
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ color: m.role === "user" ? "var(--accent)" : "var(--node-completed)", fontSize: 11, fontWeight: 600 }}>
              {m.role === "user" ? "You" : "Assistant"}
            </div>
            <div style={{ color: "var(--text-primary)", fontSize: 12, marginTop: 2 }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>Thinking...</div>}
        {error && <div style={{ color: "var(--node-failed)", fontSize: 11 }}>{error}</div>}
        <div ref={endRef} />
      </div>

      <div style={{ padding: "6px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 6 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); if (e.key === "Escape") onClose(); }}
          placeholder="Refine this workflow..."
          style={{
            flex: 1, background: "var(--bg-canvas)", border: "1px solid var(--border)",
            borderRadius: 4, padding: "4px 8px", color: "var(--text-primary)",
            fontSize: 12, fontFamily: "var(--font-ui)", outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{
            background: "var(--accent)", border: "none", color: "#fff",
            padding: "4px 12px", borderRadius: 4, fontSize: 12, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
