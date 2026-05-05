import * as yaml from "js-yaml";

export interface ChainNode {
  id: string; name: string; skill: string | null; command: string | null;
  instruction: string; inputs: string[]; model?: string; cache?: boolean;
}
export interface Chain { version: string; name: string; model: string; nodes: ChainNode[]; }

export function parseChainYaml(content: string): Chain {
  const raw = yaml.load(content) as any;
  if (!raw?.version || !raw?.name || !raw?.model || !Array.isArray(raw.nodes)) {
    throw new Error("Invalid chain: missing version, name, model, or nodes");
  }
  for (const node of raw.nodes) {
    if (node.skill && node.command) throw new Error(`Node "${node.id}": skill and command are mutually exclusive`);
  }
  return raw as Chain;
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
