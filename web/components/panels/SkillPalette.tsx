"use client";

import { useState, useEffect } from "react";
import { listSkills, type SkillItem } from "@/lib/api-client";

interface SkillPaletteProps {
  onAddSkill: (skillName: string) => void;
}

export default function SkillPalette({ onAddSkill }: SkillPaletteProps) {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSkills()
      .then(setSkills)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = skills.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: "var(--bg-node)", borderRight: "1px solid var(--border)",
      fontFamily: "var(--font-ui)", overflow: "hidden",
    }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
          Skills
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", background: "var(--bg-canvas)", border: "1px solid var(--border)",
            borderRadius: 4, padding: "6px 8px", color: "var(--text-primary)",
            fontSize: 12, fontFamily: "var(--font-ui)", outline: "none",
          }}
        />
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 4 }}>
        {loading && (
          <div style={{ padding: 12, color: "var(--text-secondary)", fontSize: 12 }}>
            Loading...
          </div>
        )}
        {error && (
          <div style={{ padding: 12, color: "var(--node-failed)", fontSize: 12 }}>
            {error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: 12, color: "var(--text-secondary)", fontSize: 12 }}>
            No skills found.
          </div>
        )}
        {filtered.map((skill) => (
          <div
            key={skill.name}
            onClick={() => onAddSkill(skill.name)}
            style={{
              padding: "8px 10px", cursor: "pointer", borderRadius: 4,
              marginBottom: 2, transition: "background 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 500 }}>
              {skill.name}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 11, marginTop: 2, lineHeight: 1.3 }}>
              {skill.description.slice(0, 80)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
