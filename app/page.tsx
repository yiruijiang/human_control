"use client";

import Link from "next/link";
import { useStore } from "@/store";
import { Bot, Zap, GitFork, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { agents, skills, harnesses } = useStore();

  const totalEquipped = agents.reduce((sum, a) => sum + a.equippedSkills.length, 0);
  const epicSkills = skills.filter((s) => s.rarity === "epic").length;

  const stats = [
    {
      label: "Agents",
      value: agents.length,
      icon: Bot,
      color: "#7c3aed",
      href: "/agents",
      sub: `${agents.filter((a) => a.equippedSkills.length > 0).length} equipped`,
    },
    {
      label: "Skills",
      value: skills.length,
      icon: Zap,
      color: "#06b6d4",
      href: "/skills",
      sub: `${epicSkills} epic`,
    },
    {
      label: "Harnesses",
      value: harnesses.length,
      icon: GitFork,
      color: "#16a34a",
      href: "/harness",
      sub: `${totalEquipped} total equipped`,
    },
  ];

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Agent Studio
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Manage your Claude agents, equip skills, and compose multi-agent workflows.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color, href, sub }) => (
          <Link key={label} href={href}>
            <div
              className="rounded-xl p-5 cursor-pointer transition-transform hover:-translate-y-1"
              style={{
                background: "var(--bg-card)",
                border: `1px solid ${color}33`,
                boxShadow: `0 0 20px ${color}15`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}22`, border: `1px solid ${color}44` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                {value}
              </div>
              <div className="text-sm font-medium" style={{ color }}>
                {label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {sub}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent harnesses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Recent Harnesses
          </h2>
          <Link href="/harness" className="text-xs" style={{ color: "var(--accent-purple)" }}>
            View all →
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {harnesses.slice(0, 5).map((h) => (
            <Link key={h.id} href={`/harness/${h.id}`}>
              <div
                className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {h.name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {h.nodes.length} agents · {h.edges.length} connections
                  </div>
                </div>
                <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
              </div>
            </Link>
          ))}
          {harnesses.length === 0 && (
            <div
              className="text-center py-8 rounded-xl"
              style={{ background: "var(--bg-card)", border: "1px dashed var(--border-default)" }}
            >
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No harnesses yet.{" "}
                <Link href="/harness" style={{ color: "var(--accent-purple)" }}>
                  Create one →
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
