import { z } from "zod";
import * as yaml from "js-yaml";
import * as fs from "fs";
import type { Chain, Config } from "./types.ts";

const NodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  skill: z.string().nullable().default(null),
  command: z.string().nullable().default(null),
  instruction: z.string().default(""),
  inputs: z.array(z.string()).default([]),
  model: z.string().optional(),
  cache: z.boolean().optional().default(false),
}).refine(
  (n) => !(n.skill !== null && n.command !== null),
  { message: "skill and command are mutually exclusive" }
);

const ChainSchema = z.object({
  version: z.string(),
  name: z.string().min(1),
  model: z.string().min(1),
  nodes: z.array(NodeSchema).min(1),
});

const ModelConfigSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("claude_code_cli"), timeout_ms: z.number().optional() }),
  z.object({
    type: z.literal("local"),
    base_url: z.string(),
    model: z.string(),
  }),
  z.object({
    type: z.literal("api"),
    base_url: z.string(),
    key_env: z.string(),
    model: z.string(),
  }),
]);

const ConfigSchema = z.object({
  models: z.record(ModelConfigSchema),
});

export function parseChain(filePath: string): Chain {
  const raw = yaml.load(fs.readFileSync(filePath, "utf8"));
  return ChainSchema.parse(raw) as Chain;
}

export function parseConfig(filePath: string): Config {
  const raw = yaml.load(fs.readFileSync(filePath, "utf8"));
  return ConfigSchema.parse(raw) as Config;
}

export async function runPreflightChecks(chain: Chain, config: Config, assetsPath: string): Promise<void> {
  // 1. claude binary in PATH
  const claudePath = Bun.which("claude");
  if (!claudePath) {
    console.warn("[preflight] claude not found in PATH — claude_code_cli nodes will fail");
  }

  // 2. skill file existence
  const gstackPath = `${assetsPath}/repos/gstack`;
  for (const node of chain.nodes) {
    if (node.skill) {
      const skillFile = `${gstackPath}/${node.skill}/SKILL.md`;
      if (!fs.existsSync(skillFile)) {
        throw new Error(`skill "${node.skill}" not found at ${skillFile}`);
      }
    }
  }

  // 3. Ollama health check for local models (warn only)
  const OLLAMA_TAGS_URL = "http://localhost:11434/api/tags";
  const hasLocalModel = chain.nodes.some(
    (n) => config.models[n.model ?? chain.model]?.type === "local"
  );
  if (hasLocalModel) {
    try {
      const resp = await fetch(OLLAMA_TAGS_URL);
      if (!resp.ok) console.warn("[preflight] Ollama not reachable — local model nodes will fail");
    } catch {
      console.warn("[preflight] Ollama not running — local model nodes will fail");
    }
  }
}

export function validateChain(chain: Chain, config: Config): void {
  const modelKeys = new Set(Object.keys(config.models));

  if (!modelKeys.has(chain.model)) {
    throw new Error(`top-level model "${chain.model}" not found in config.yaml`);
  }

  const nodeIds = new Set(chain.nodes.map((n) => n.id));

  // Check for duplicate node IDs
  if (nodeIds.size !== chain.nodes.length) {
    const seen = new Set<string>();
    for (const n of chain.nodes) {
      if (seen.has(n.id)) {
        throw new Error(`duplicate node id "${n.id}"`);
      }
      seen.add(n.id);
    }
  }

  for (const node of chain.nodes) {
    const effectiveModel = node.model ?? chain.model;
    if (!modelKeys.has(effectiveModel)) {
      throw new Error(`node "${node.id}" model "${effectiveModel}" not found in config.yaml`);
    }

    for (const dep of node.inputs) {
      if (!nodeIds.has(dep)) {
        throw new Error(`node "${node.id}" inputs references unknown node "${dep}"`);
      }
      if (dep === node.id) {
        throw new Error(`node "${node.id}" cannot depend on itself`);
      }
    }
  }
}
