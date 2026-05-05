import * as yaml from "js-yaml";

export interface ChainNode {
  id: string; name: string; skill: string | null; command: string | null;
  instruction: string; inputs: string[]; model?: string; cache?: boolean;
}
export interface Chain { version: string; name: string; model: string; nodes: ChainNode[]; }

export function parseChainYaml(content: string): Chain {
  const raw = yaml.load(content) as any;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid chain: not a valid YAML object");
  }
  if (!raw.version) throw new Error("Invalid chain: missing 'version' field");
  if (!raw.name) throw new Error("Invalid chain: missing 'name' field");
  if (!raw.model) throw new Error("Invalid chain: missing 'model' field");
  if (!Array.isArray(raw.nodes)) throw new Error("Invalid chain: 'nodes' must be an array");
  if (raw.nodes.length === 0) throw new Error("Invalid chain: 'nodes' array is empty");

  const nodeIds = new Set<string>();
  for (const node of raw.nodes) {
    if (!node.id) throw new Error("Invalid chain: node missing 'id'");
    if (!node.name) throw new Error(`Invalid chain: node "${node.id}" missing 'name'`);
    if (node.skill && node.command) throw new Error(`Node "${node.id}": skill and command are mutually exclusive`);
    if (nodeIds.has(node.id)) throw new Error(`Duplicate node id "${node.id}"`);
    nodeIds.add(node.id);
  }

  for (const node of raw.nodes) {
    const inputs: string[] = Array.isArray(node.inputs) ? node.inputs : [];
    for (const dep of inputs) {
      if (!nodeIds.has(dep)) throw new Error(`Node "${node.id}" references unknown input "${dep}"`);
      if (dep === node.id) throw new Error(`Node "${node.id}" cannot depend on itself`);
    }
  }

  return {
    version: raw.version,
    name: raw.name,
    model: raw.model,
    nodes: raw.nodes.map((n: any) => ({
      id: n.id,
      name: n.name,
      skill: n.skill ?? null,
      command: n.command ?? null,
      instruction: n.instruction ?? "",
      inputs: Array.isArray(n.inputs) ? n.inputs : [],
      model: n.model,
      cache: n.cache ?? false,
    })),
  };
}

export function topologicalSort(chain: Chain): ChainNode[] {
  const nodes = chain.nodes;
  const idToNode = new Map(nodes.map((n) => [n.id, n]));
  const inDeg = new Map<string, number>();
  const children = new Map<string, string[]>();

  for (const node of nodes) { inDeg.set(node.id, 0); children.set(node.id, []); }
  for (const node of nodes) {
    for (const dep of node.inputs) {
      inDeg.set(node.id, (inDeg.get(node.id) ?? 0) + 1);
      children.get(dep)!.push(node.id);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDeg) { if (deg === 0) queue.push(id); }

  const order: ChainNode[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(idToNode.get(id)!);
    for (const child of children.get(id) ?? []) {
      const newDeg = (inDeg.get(child) ?? 1) - 1;
      inDeg.set(child, newDeg);
      if (newDeg === 0) queue.push(child);
    }
  }

  if (order.length !== nodes.length) throw new Error("Cycle detected in chain");
  return order;
}
