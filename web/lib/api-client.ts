const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export interface ChainListItem {
  name: string;
  path: string;
}

export interface SkillItem {
  name: string;
  description: string;
  path: string;
}

export async function listChains(): Promise<ChainListItem[]> {
  return request("/chains");
}

export async function getChain(id: string): Promise<string> {
  const res = await fetch(`${BASE}/chain/${id}`);
  if (!res.ok) throw new Error(`Failed to load chain: ${res.status}`);
  return res.text();
}

export async function saveChain(id: string, yaml: string): Promise<void> {
  await fetch(`${BASE}/chain/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body: yaml,
  });
}

export async function createChain(name: string, yaml: string): Promise<void> {
  await fetch(`${BASE}/chains`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, yaml }),
  });
}

export async function listSkills(): Promise<SkillItem[]> {
  return request("/skills");
}

export async function generateChain(description: string): Promise<string> {
  const res = await fetch(`${BASE}/generate-chain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Generation failed");
  }
  const data = await res.json();
  return data.yaml;
}

export async function listRuns(): Promise<any[]> {
  return request("/runs");
}

export async function getArtifact(runId: string, nodeId: string): Promise<any> {
  return request(`/runs/${runId}/${nodeId}`);
}
