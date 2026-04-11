"use client";

import { useState } from "react";
import { useStore } from "@/store";
import { AgentCard } from "@/components/AgentCard";
import { Search } from "lucide-react";
import type { AgentCategory } from "@/types";

const CATEGORIES: { value: AgentCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "specialist", label: "Specialists" },
  { value: "reviewer", label: "Reviewers" },
  { value: "resolver", label: "Resolvers" },
  { value: "planner", label: "Planners" },
  { value: "operator", label: "Operators" },
];

export default function AgentsPage() {
  const { agents, skills } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AgentCategory | "all">("all");

  const filtered = agents.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || a.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Agents
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          {agents.length} agents available · Select an agent to equip skills
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents…"
            className="w-full pl-8 pr-4 py-2 text-sm rounded-lg outline-none"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background:
                  category === value
                    ? "rgba(124, 58, 237, 0.2)"
                    : "rgba(255,255,255,0.04)",
                color:
                  category === value ? "#a78bfa" : "var(--text-secondary)",
                border:
                  category === value
                    ? "1px solid rgba(124, 58, 237, 0.4)"
                    : "1px solid var(--border-default)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((agent) => (
          <AgentCard key={agent.id} agent={agent} skills={skills} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          className="text-center py-16 rounded-xl mt-4"
          style={{ border: "1px dashed var(--border-default)" }}
        >
          <p style={{ color: "var(--text-muted)" }}>No agents match your filters.</p>
        </div>
      )}
    </div>
  );
}
