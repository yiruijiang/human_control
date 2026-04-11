export type AgentCategory = "reviewer" | "planner" | "resolver" | "specialist" | "operator";

export type SkillCategory = "backend" | "frontend" | "security" | "content" | "ai" | "devops" | "data";

export type SkillRarity = "common" | "rare" | "epic";

export interface Agent {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: AgentCategory;
  description: string;
  systemPrompt: string;
  equippedSkills: string[];
}

export interface Skill {
  id: string;
  name: string;
  displayName: string;
  category: SkillCategory;
  description: string;
  content: string;
  tags: string[];
  rarity: SkillRarity;
}

export interface HarnessNode {
  id: string;
  agentId: string;
  position: { x: number; y: number };
  config: Record<string, string>;
}

export interface HarnessEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Harness {
  id: string;
  name: string;
  description: string;
  nodes: HarnessNode[];
  edges: HarnessEdge[];
  createdAt: string;
  updatedAt: string;
}
