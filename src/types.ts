export interface ChainNode {
  id: string;
  name: string;
  skill: string | null;
  command: string | null;
  instruction: string;
  inputs: string[];
  model?: string;
  cache?: boolean;
}

export interface Chain {
  version: string;
  name: string;
  model: string;
  nodes: ChainNode[];
}

export interface ModelConfig {
  type: "claude_code_cli" | "local" | "api";
  base_url?: string;
  key_env?: string;
  model?: string;
  timeout_ms?: number;
}

export interface Config {
  models: Record<string, ModelConfig>;
}

export interface Artifact {
  node_id: string;
  node_name: string;
  run_id: string;
  model: string;
  status: "completed" | "failed";
  output: string;
  error: string | null;
  duration_ms: number;
}

export interface RunMeta {
  chain_file: string;
  started_at: string;
}
