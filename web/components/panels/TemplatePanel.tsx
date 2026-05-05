"use client";

import { useState, useEffect } from "react";

interface Template {
  id: string;
  name: string;
  skill: string | null;
  command: string | null;
  instruction: string;
}

const STORAGE_KEY = "hc-templates";

function loadTemplates(): Template[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}

function saveTemplates(ts: Template[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ts));
}

interface TemplatePanelProps {
  onAddTemplate: (t: Template) => void;
  currentNode: { name: string; skill: string | null; command: string | null; instruction: string } | null;
}

export default function TemplatePanel({ onAddTemplate, currentNode }: TemplatePanelProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => { setTemplates(loadTemplates()); }, []);

  const saveCurrent = () => {
    if (!currentNode) return;
    const t: Template = {
      id: `tpl-${Date.now()}`,
      name: currentNode.name,
      skill: currentNode.skill,
      command: currentNode.command,
      instruction: currentNode.instruction,
    };
    const updated = [...templates, t];
    setTemplates(updated);
    saveTemplates(updated);
  };

  const deleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: "var(--bg-node)", borderRight: "1px solid var(--border)",
      fontFamily: "var(--font-ui)", overflow: "hidden",
    }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          Templates
        </div>
        <input
          type="text" placeholder="Search..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", background: "var(--bg-canvas)", border: "1px solid var(--border)",
            borderRadius: 4, padding: "6px 8px", color: "var(--text-primary)",
            fontSize: 12, fontFamily: "var(--font-ui)", outline: "none",
          }}
        />
        {currentNode && (
          <button
            onClick={saveCurrent}
            style={{
              width: "100%", marginTop: 6, background: "transparent",
              border: "1px solid var(--accent)", color: "var(--accent)",
              padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer",
            }}
          >
            Save current node as template
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 4 }}>
        {filtered.length === 0 && (
          <div style={{ padding: 12, color: "var(--text-secondary)", fontSize: 12 }}>
            {templates.length === 0
              ? "No templates. Right-click a node → Save as template."
              : "No matches."}
          </div>
        )}
        {filtered.map((t) => (
          <div
            key={t.id}
            onClick={() => onAddTemplate(t)}
            style={{
              padding: "8px 10px", cursor: "pointer", borderRadius: 4,
              marginBottom: 2, transition: "background 0.1s", position: "relative",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 500 }}>{t.name}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 11, marginTop: 2, lineHeight: 1.3 }}>
              {t.instruction.slice(0, 60)}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}
              style={{
                position: "absolute", right: 6, top: 6, background: "transparent",
                border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 12,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
