import type { Chain, ChainNode } from "./types.ts";

export function topologicalSort(chain: Chain): ChainNode[] {
  const nodes = chain.nodes;
  const idToNode = new Map(nodes.map((n) => [n.id, n]));

  // Kahn's algorithm
  const inDeg = new Map<string, number>();
  const children = new Map<string, string[]>();

  for (const node of nodes) {
    inDeg.set(node.id, 0);
    children.set(node.id, []);
  }
  for (const node of nodes) {
    for (const dep of node.inputs) {
      inDeg.set(node.id, (inDeg.get(node.id) ?? 0) + 1);
      children.get(dep)!.push(node.id);
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDeg) {
    if (deg === 0) queue.push(id);
  }

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

  if (order.length !== nodes.length) {
    // Find cycle path for error message
    const remaining = nodes.filter((n) => !order.find((o) => o.id === n.id));
    const cycleNode = remaining[0];
    throw new Error(`cycle detected involving node "${cycleNode.id}"`);
  }

  return order;
}
