"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/store";
import { GitFork, Plus, Trash2, ArrowRight } from "lucide-react";
import type { Harness } from "@/types";

export default function HarnessListPage() {
  const { agents, harnesses, addHarness, deleteHarness } = useStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    const harness: Harness = {
      id: `harness-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim(),
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addHarness(harness);
    setNewName("");
    setNewDesc("");
    setCreating(false);
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Harnesses
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Compose multi-agent workflows on a visual canvas
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg"
          style={{
            background: "rgba(124, 58, 237, 0.2)",
            color: "#a78bfa",
            border: "1px solid rgba(124, 58, 237, 0.4)",
          }}
        >
          <Plus size={14} />
          New Harness
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div
          className="rounded-xl p-5 mb-6"
          style={{
            background: "var(--bg-card)",
            border: "1px solid rgba(124, 58, 237, 0.3)",
          }}
        >
          <div className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>
            New Harness
          </div>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Harness name…"
            className="w-full px-3 py-2 text-sm rounded-lg mb-2 outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
            autoFocus
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)…"
            className="w-full px-3 py-2 text-sm rounded-lg mb-3 outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="text-sm px-4 py-1.5 rounded-lg"
              style={{
                background: "rgba(124, 58, 237, 0.25)",
                color: "#a78bfa",
                border: "1px solid rgba(124, 58, 237, 0.4)",
              }}
            >
              Create
            </button>
            <button
              onClick={() => setCreating(false)}
              className="text-sm px-4 py-1.5 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-default)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Harness list */}
      <div className="flex flex-col gap-3">
        {harnesses.map((h) => {
          const nodeAgents = h.nodes
            .map((n) => agents.find((a) => a.id === n.agentId))
            .filter(Boolean);

          return (
            <div
              key={h.id}
              className="rounded-xl p-5"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                    {h.name}
                  </div>
                  {h.description && (
                    <div className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
                      {h.description}
                    </div>
                  )}
                  {/* Agent previews */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {nodeAgents.map((agent, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && (
                          <ArrowRight size={10} style={{ color: "var(--text-muted)" }} />
                        )}
                        <span
                          className="text-xs px-2 py-0.5 rounded-md"
                          style={{
                            background: `${agent!.color}18`,
                            color: agent!.color,
                            border: `1px solid ${agent!.color}33`,
                          }}
                        >
                          {agent!.icon} {agent!.name}
                        </span>
                      </span>
                    ))}
                    {h.nodes.length === 0 && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        No agents yet
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => deleteHarness(h.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg"
                    style={{
                      background: "rgba(220, 38, 38, 0.1)",
                      color: "#f87171",
                      border: "1px solid rgba(220, 38, 38, 0.2)",
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                  <Link
                    href={`/harness/${h.id}`}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                    style={{
                      background: "rgba(124, 58, 237, 0.15)",
                      color: "#a78bfa",
                      border: "1px solid rgba(124, 58, 237, 0.3)",
                    }}
                  >
                    Open Canvas
                    <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {harnesses.length === 0 && !creating && (
          <div
            className="text-center py-16 rounded-xl"
            style={{ border: "1px dashed var(--border-default)" }}
          >
            <GitFork size={32} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No harnesses yet. Create one to start composing workflows.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
