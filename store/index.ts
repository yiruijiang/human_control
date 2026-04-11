"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Agent, Skill, Harness, HarnessNode, HarnessEdge } from "@/types";
import agentsData from "@/data/agents.json";
import skillsData from "@/data/skills.json";
import harnessesData from "@/data/harnesses.json";

interface StoreState {
  agents: Agent[];
  skills: Skill[];
  harnesses: Harness[];

  // Agent actions
  equipSkill: (agentId: string, skillId: string) => void;
  unequipSkill: (agentId: string, skillId: string) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  addAgent: (agent: Agent) => void;

  // Harness actions
  addHarness: (harness: Harness) => void;
  updateHarness: (harnessId: string, updates: Partial<Harness>) => void;
  deleteHarness: (harnessId: string) => void;
  addHarnessNode: (harnessId: string, node: HarnessNode) => void;
  removeHarnessNode: (harnessId: string, nodeId: string) => void;
  addHarnessEdge: (harnessId: string, edge: HarnessEdge) => void;
  removeHarnessEdge: (harnessId: string, edgeId: string) => void;
  updateHarnessNodes: (harnessId: string, nodes: HarnessNode[]) => void;
  updateHarnessEdges: (harnessId: string, edges: HarnessEdge[]) => void;
}

// Cast imported JSON to proper types
const initialAgents = agentsData as unknown as Agent[];
const initialSkills = skillsData as unknown as Skill[];
const initialHarnesses = harnessesData as unknown as Harness[];

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      agents: initialAgents,
      skills: initialSkills,
      harnesses: initialHarnesses,

      equipSkill: (agentId, skillId) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId && !a.equippedSkills.includes(skillId)
              ? { ...a, equippedSkills: [...a.equippedSkills, skillId] }
              : a
          ),
        })),

      unequipSkill: (agentId, skillId) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId
              ? { ...a, equippedSkills: a.equippedSkills.filter((s) => s !== skillId) }
              : a
          ),
        })),

      updateAgent: (agentId, updates) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId ? { ...a, ...updates } : a
          ),
        })),

      addAgent: (agent) =>
        set((state) => ({ agents: [...state.agents, agent] })),

      addHarness: (harness) =>
        set((state) => ({ harnesses: [...state.harnesses, harness] })),

      updateHarness: (harnessId, updates) =>
        set((state) => ({
          harnesses: state.harnesses.map((h) =>
            h.id === harnessId
              ? { ...h, ...updates, updatedAt: new Date().toISOString() }
              : h
          ),
        })),

      deleteHarness: (harnessId) =>
        set((state) => ({
          harnesses: state.harnesses.filter((h) => h.id !== harnessId),
        })),

      addHarnessNode: (harnessId, node) =>
        set((state) => ({
          harnesses: state.harnesses.map((h) =>
            h.id === harnessId
              ? { ...h, nodes: [...h.nodes, node], updatedAt: new Date().toISOString() }
              : h
          ),
        })),

      removeHarnessNode: (harnessId, nodeId) =>
        set((state) => ({
          harnesses: state.harnesses.map((h) =>
            h.id === harnessId
              ? {
                  ...h,
                  nodes: h.nodes.filter((n) => n.id !== nodeId),
                  edges: h.edges.filter(
                    (e) => e.source !== nodeId && e.target !== nodeId
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : h
          ),
        })),

      addHarnessEdge: (harnessId, edge) =>
        set((state) => ({
          harnesses: state.harnesses.map((h) =>
            h.id === harnessId
              ? { ...h, edges: [...h.edges, edge], updatedAt: new Date().toISOString() }
              : h
          ),
        })),

      removeHarnessEdge: (harnessId, edgeId) =>
        set((state) => ({
          harnesses: state.harnesses.map((h) =>
            h.id === harnessId
              ? {
                  ...h,
                  edges: h.edges.filter((e) => e.id !== edgeId),
                  updatedAt: new Date().toISOString(),
                }
              : h
          ),
        })),

      updateHarnessNodes: (harnessId, nodes) =>
        set((state) => ({
          harnesses: state.harnesses.map((h) =>
            h.id === harnessId
              ? { ...h, nodes, updatedAt: new Date().toISOString() }
              : h
          ),
        })),

      updateHarnessEdges: (harnessId, edges) =>
        set((state) => ({
          harnesses: state.harnesses.map((h) =>
            h.id === harnessId
              ? { ...h, edges, updatedAt: new Date().toISOString() }
              : h
          ),
        })),
    }),
    {
      name: "agent-studio-storage",
      // Don't persist base data — only user mutations
      partialize: (state) => ({
        agents: state.agents,
        harnesses: state.harnesses,
      }),
    }
  )
);
