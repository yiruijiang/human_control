"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/store";
import { InventoryPanel } from "@/components/InventoryPanel";
import { ChevronLeft, Zap } from "lucide-react";

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { agents, skills } = useStore();

  const agent = agents.find((a) => a.id === id);
  if (!agent) return notFound();

  const equipped = skills.filter((s) => agent.equippedSkills.includes(s.id));

  return (
    <div className="p-8 max-w-6xl">
      {/* Back */}
      <Link
        href="/agents"
        className="flex items-center gap-1 text-sm mb-6"
        style={{ color: "var(--text-secondary)" }}
      >
        <ChevronLeft size={14} />
        Back to Agents
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left — Agent info */}
        <div>
          {/* Agent header */}
          <div
            className="rounded-2xl p-6 mb-6 relative overflow-hidden"
            style={{
              background: "var(--bg-card)",
              border: `1px solid ${agent.color}44`,
              boxShadow: `0 0 30px ${agent.color}18`,
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)` }}
            />
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                style={{
                  background: `${agent.color}22`,
                  border: `1px solid ${agent.color}55`,
                  boxShadow: `0 0 20px ${agent.color}35`,
                }}
              >
                {agent.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {agent.name}
                </h1>
                <span
                  className="text-xs px-3 py-1 rounded-full"
                  style={{
                    background: `${agent.color}22`,
                    color: agent.color,
                    border: `1px solid ${agent.color}44`,
                  }}
                >
                  {agent.category}
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {agent.description}
            </p>

            {equipped.length > 0 && (
              <div className="mt-4 flex items-center gap-1.5" style={{ color: "var(--accent-cyan)" }}>
                <Zap size={13} />
                <span className="text-xs">{equipped.length} skills equipped</span>
              </div>
            )}
          </div>

          {/* System prompt */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
          >
            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>
              System Prompt
            </h3>
            <div
              className="text-xs leading-relaxed font-mono max-h-64 overflow-y-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              <AgentPrompt agentId={agent.id} />
            </div>
          </div>
        </div>

        {/* Right — Inventory panel */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)" }}
        >
          <h2 className="text-sm font-bold mb-5" style={{ color: "var(--text-primary)" }}>
            Skill Inventory
          </h2>
          <InventoryPanel agent={agent} allSkills={skills} />
        </div>
      </div>
    </div>
  );
}

// Lazy-load the system prompt content from the API
function AgentPrompt({ agentId }: { agentId: string }) {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    fetch(`/api/agent-prompt?id=${encodeURIComponent(agentId)}`)
      .then((r) => r.json())
      .then((d) => d.content && setContent(d.content))
      .catch(() => setContent("(Prompt not available)"));
  }, [agentId]);

  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {content || "Loading…"}
    </span>
  );
}
