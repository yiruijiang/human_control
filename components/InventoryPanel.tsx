"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus } from "lucide-react";
import { useStore } from "@/store";
import { SkillCard } from "./SkillCard";
import type { Agent, Skill } from "@/types";

interface InventoryPanelProps {
  agent: Agent;
  allSkills: Skill[];
}

export function InventoryPanel({ agent, allSkills }: InventoryPanelProps) {
  const { equipSkill, unequipSkill } = useStore();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const equipped = allSkills.filter((s) => agent.equippedSkills.includes(s.id));
  const available = allSkills.filter((s) => !agent.equippedSkills.includes(s.id));

  return (
    <div className="flex flex-col gap-6">
      {/* Equipped slots */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Equipped Skills
          </h3>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {equipped.length} / 8
          </span>
        </div>

        {/* RPG grid — 4 cols */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {Array.from({ length: 8 }).map((_, i) => {
            const skill = equipped[i];
            return (
              <motion.div
                key={i}
                whileHover={{ scale: skill ? 1.05 : 1 }}
                className="aspect-square rounded-lg flex items-center justify-center relative"
                style={{
                  background: skill ? "rgba(124, 58, 237, 0.12)" : "rgba(255,255,255,0.03)",
                  border: skill
                    ? "1px solid rgba(124, 58, 237, 0.4)"
                    : "1px dashed rgba(255,255,255,0.1)",
                }}
              >
                {skill ? (
                  <>
                    <button
                      onClick={() => unequipSkill(agent.id, skill.id)}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(220, 38, 38, 0.8)" }}
                    >
                      <X size={8} />
                    </button>
                    <span className="text-lg">{getSkillIcon(skill.category)}</span>
                    <div
                      className="absolute bottom-0 left-0 right-0 text-center text-xs py-0.5 rounded-b-lg truncate px-1"
                      style={{
                        background: "rgba(0,0,0,0.5)",
                        color: "var(--text-secondary)",
                        fontSize: "9px",
                      }}
                    >
                      {skill.displayName}
                    </div>
                  </>
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>EMPTY</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border-default)" }} />

      {/* Available skills */}
      <div>
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          Available Skills
        </h3>
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          <AnimatePresence>
            {available.map((skill) => (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-2"
              >
                <div className="flex-1">
                  <SkillCard skill={skill} compact onClick={() => setSelectedSkill(skill)} />
                </div>
                <button
                  onClick={() => {
                    if (equipped.length < 8) {
                      equipSkill(agent.id, skill.id);
                    }
                  }}
                  disabled={equipped.length >= 8}
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    background:
                      equipped.length >= 8
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(124, 58, 237, 0.2)",
                    color: equipped.length >= 8 ? "var(--text-muted)" : "#a78bfa",
                    border: "1px solid rgba(124, 58, 237, 0.3)",
                  }}
                >
                  <Plus size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {available.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
              All skills equipped
            </p>
          )}
        </div>
      </div>

      {/* Skill detail modal */}
      <AnimatePresence>
        {selectedSkill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setSelectedSkill(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl p-6 relative"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-active)",
                maxHeight: "80vh",
                overflow: "auto",
              }}
            >
              <button
                onClick={() => setSelectedSkill(null)}
                className="absolute top-4 right-4"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={18} />
              </button>
              <div className="mb-4">
                <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {selectedSkill.displayName}
                </div>
                <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  {selectedSkill.description}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedSkill.tags.map((t) => (
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

function getSkillIcon(category: string): string {
  const map: Record<string, string> = {
    backend: "⚙️",
    frontend: "🎨",
    security: "🛡️",
    content: "✍️",
    ai: "🤖",
    devops: "🚢",
    data: "📊",
  };
  return map[category] ?? "⚡";
}
