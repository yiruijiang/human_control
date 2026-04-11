"use client";

import { motion } from "framer-motion";
import type { Skill } from "@/types";

interface SkillCardProps {
  skill: Skill;
  onClick?: () => void;
  equipped?: boolean;
  compact?: boolean;
}

const RARITY_CONFIG = {
  common: {
    border: "rgba(148, 163, 184, 0.25)",
    bg: "rgba(148, 163, 184, 0.06)",
    glow: "rgba(148, 163, 184, 0.12)",
    badge: "#94a3b8",
    label: "COMMON",
  },
  rare: {
    border: "rgba(59, 130, 246, 0.4)",
    bg: "rgba(59, 130, 246, 0.08)",
    glow: "rgba(59, 130, 246, 0.2)",
    badge: "#60a5fa",
    label: "RARE",
  },
  epic: {
    border: "rgba(168, 85, 247, 0.5)",
    bg: "rgba(168, 85, 247, 0.1)",
    glow: "rgba(168, 85, 247, 0.25)",
    badge: "#c084fc",
    label: "EPIC",
  },
};

const CATEGORY_ICON: Record<string, string> = {
  backend: "⚙️",
  frontend: "🎨",
  security: "🛡️",
  content: "✍️",
  ai: "🤖",
  devops: "🚢",
  data: "📊",
};

export function SkillCard({ skill, onClick, equipped, compact }: SkillCardProps) {
  const rarity = RARITY_CONFIG[skill.rarity];
  const catIcon = CATEGORY_ICON[skill.category] ?? "⚡";

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
        className="rounded-lg p-3 cursor-pointer"
        style={{
          background: equipped ? "rgba(124, 58, 237, 0.15)" : rarity.bg,
          border: `1px solid ${equipped ? "rgba(124, 58, 237, 0.5)" : rarity.border}`,
          boxShadow: equipped ? `0 0 12px rgba(124, 58, 237, 0.2)` : `0 0 8px ${rarity.glow}`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{catIcon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {skill.displayName}
            </div>
            <div className="text-xs mt-0.5" style={{ color: rarity.badge }}>
              {rarity.label}
            </div>
          </div>
          {equipped && <span className="text-xs" style={{ color: "#a78bfa" }}>✓</span>}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="rounded-xl p-4 cursor-pointer relative overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${rarity.border}`,
        boxShadow: `0 0 16px ${rarity.glow}`,
      }}
    >
      {/* Rarity shine */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${rarity.badge}, transparent)` }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{catIcon}</span>
          <div>
            <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              {skill.displayName}
            </div>
            <div
              className="text-xs font-mono tracking-wider"
              style={{ color: rarity.badge }}
            >
              {rarity.label}
            </div>
          </div>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: `${rarity.badge}18`,
            color: rarity.badge,
            border: `1px solid ${rarity.badge}30`,
          }}
        >
          {skill.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
        {skill.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {skill.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-default)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
