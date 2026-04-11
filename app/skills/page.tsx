"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store";
import { SkillCard } from "@/components/SkillCard";
import { X } from "lucide-react";
import type { Skill, SkillCategory } from "@/types";

const CATEGORIES: { value: SkillCategory | "all"; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "⚡" },
  { value: "backend", label: "Backend", icon: "⚙️" },
  { value: "frontend", label: "Frontend", icon: "🎨" },
  { value: "ai", label: "AI", icon: "🤖" },
  { value: "content", label: "Content", icon: "✍️" },
  { value: "security", label: "Security", icon: "🛡️" },
  { value: "devops", label: "DevOps", icon: "🚢" },
  { value: "data", label: "Data", icon: "📊" },
];

const RARITY_ORDER = { epic: 0, rare: 1, common: 2 };

export default function SkillsPage() {
  const { skills } = useStore();
  const [category, setCategory] = useState<SkillCategory | "all">("all");
  const [selected, setSelected] = useState<Skill | null>(null);

  const filtered = skills
    .filter((s) => category === "all" || s.category === category)
    .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Skill Inventory
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          {skills.length} skills available · Equip them to agents from the Agent detail page
        </p>
      </div>

      {/* Rarity legend */}
      <div className="flex items-center gap-4 mb-5">
        {(["epic", "rare", "common"] as const).map((r) => (
          <div key={r} className="flex items-center gap-1.5 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background:
                  r === "epic" ? "#c084fc" : r === "rare" ? "#60a5fa" : "#94a3b8",
                boxShadow:
                  r === "epic"
                    ? "0 0 6px rgba(168,85,247,0.6)"
                    : r === "rare"
                    ? "0 0 6px rgba(59,130,246,0.6)"
                    : "none",
              }}
            />
            <span style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {r}
            </span>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background:
                category === value ? "rgba(6, 182, 212, 0.15)" : "rgba(255,255,255,0.04)",
              color: category === value ? "var(--accent-cyan)" : "var(--text-secondary)",
              border:
                category === value
                  ? "1px solid rgba(6, 182, 212, 0.4)"
                  : "1px solid var(--border-default)",
            }}
          >
            <span>{icon}</span>
            {label}
            {category === value && (
              <span
                className="ml-1 rounded-full px-1.5"
                style={{ background: "rgba(6,182,212,0.2)", color: "var(--accent-cyan)" }}
              >
                {filtered.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((skill) => (
            <motion.div
              key={skill.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <SkillCard skill={skill} onClick={() => setSelected(skill)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div
          className="text-center py-16 rounded-xl"
          style={{ border: "1px dashed var(--border-default)" }}
        >
          <p style={{ color: "var(--text-muted)" }}>No skills in this category.</p>
        </div>
      )}

      {/* Skill detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl p-6 relative"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-active)",
                maxHeight: "85vh",
                overflow: "auto",
              }}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <X size={14} />
              </button>

              <div className="mb-4">
                <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {selected.displayName}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {selected.category} · {selected.rarity.toUpperCase()}
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                {selected.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {selected.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
