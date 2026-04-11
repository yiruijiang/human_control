"use client";

import { Handle, Position } from "@xyflow/react";
import { Zap } from "lucide-react";

interface AgentNodeData {
  agent: {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    equippedSkills: string[];
  };
  skillCount: number;
}

export function AgentNode({ data }: { data: AgentNodeData }) {
  const { agent, skillCount } = data;

  return (
    <div
      className="rounded-xl p-3 relative"
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${agent.color}55`,
        boxShadow: `0 0 20px ${agent.color}25, 0 4px 16px rgba(0,0,0,0.4)`,
        minWidth: 160,
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)` }}
      />

      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: agent.color,
          border: `2px solid ${agent.color}88`,
          width: 10,
          height: 10,
        }}
      />

      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
          style={{
            background: `${agent.color}22`,
            border: `1px solid ${agent.color}44`,
          }}
        >
          {agent.icon}
        </div>
        <div>
          <div className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>
            {agent.name}
          </div>
          {skillCount > 0 && (
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--accent-cyan)" }}>
              <Zap size={9} />
              {skillCount} skills
            </div>
          )}
        </div>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {agent.description.slice(0, 60)}…
      </p>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: agent.color,
          border: `2px solid ${agent.color}88`,
          width: 10,
          height: 10,
        }}
      />
    </div>
  );
}
