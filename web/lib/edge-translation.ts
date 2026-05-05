import type { Edge, Node } from "@xyflow/react";

interface ChainNodeLike {
  id: string;
  inputs: string[];
}

export function yamlToEdges(nodes: ChainNodeLike[]): Edge[] {
  return nodes.flatMap((n) =>
    n.inputs.map((parentId) => ({
      id: `${parentId}->${n.id}`,
      source: parentId,
      target: n.id,
      type: "smoothstep",
      animated: false,
    }))
  );
}

export function edgesToInputs(nodeId: string, edges: Edge[]): string[] {
  return edges
    .filter((e) => e.target === nodeId)
    .map((e) => e.source);
}

export function buildInputsFromEdges(nodeIds: string[], edges: Edge[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const id of nodeIds) {
    result[id] = edgesToInputs(id, edges);
  }
  return result;
}
