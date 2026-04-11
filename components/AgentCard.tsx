"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Zap } from "lucide-react";
import type { Agent, Skill } from "@/types";

interface AgentCardProps {
  agent: Agent;
  skills: Skill[];
}

const CATEGORY_BADGE: Record<string, { label: string; color: string }> = {
  reviewer: { label: "Reviewer", color: "#0891b2" },
  planner: { label: "Planner", color: "#2563eb" },
  resolver: { label: "Resolver", color: "#16a34a" },
  specialist: { label: "Specialist", color: "#7c3aed" },
  operator: { label: "Operator", color: "#475569" },
};

export function AgentCard({ agent, skills }: AgentCardProps) {
  const badge = CATEGORY_BADGE[agent.category] ?? { label: agent.category, color: "#475569" };
  const equippedSkills = skills.filter((s) => agent.equippedSkills.includes(s.id));

  return (
    <Link href={`/agents/${agent.id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.15 }}
        className="rounded-xl p-4 cursor-pointer relative overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: `1px solid ${agent.color}33`,
          boxShadow: `0 0 20px ${agent.color}18`,
        }}
      >
        {/* Top glow bar */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)` }}
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{
                background: `${agent.color}22`,
                border: `1px solid ${agent.color}44`,
                boxShadow: `0 0 12px ${agent.color}30`,
              }}
            >
              {agent.icon}
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                {agent.name}
              </div>
              {/* Category badge */}
              <span
                className="text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block"
                style={{
                  background: `${badge.color}22`,
                  color: badge.color,
                  border: `1px solid ${badge.color}44`,
                }}
              >
                {badge.label}
              </span>
            </div>
          </div>

          {/* Equipped count */}
          {equippedSkills.length > 0 && (
            <div
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
              style={{
                background: "rgba(6, 182, 212, 0.1)",
                color: "var(--accent-cyan)",
                border: "1px solid rgba(6, 182, 212, 0.25)",
              }}
            >
              <Zap size={10} />
              {equippedSkills.length}
            </div>
          )}
        </div>

        {/* Description */}
        <p
          className="text-xs leading-relaxed mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          {agent.description}
        </p>

        {/* Equipped skills */}
        {equippedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {equippedSkills.slice(0, 4).map((skill) => (
              <span
                key={skill.id}
                className="text-xs px-2 py-0.5 rounded-md"
                style={{
                  background: "rgba(124, 58, 237, 0.15)",
                  color: "#a78bfa",
                  border: "1px solid rgba(124, 58, 237, 0.3)",
                }}
              >
                {skill.displayName}
              </span>
            ))}
            {equippedSkills.length > 4 && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                +{equippedSkills.length - 4}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </Link>
  );
}
