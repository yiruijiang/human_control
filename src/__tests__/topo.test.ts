import { describe, it, expect } from "bun:test";
import { topologicalSort } from "../topo.ts";
import type { Chain } from "../types.ts";

function makeChain(nodes: Array<{ id: string; inputs: string[] }>): Chain {
  return {
    version: "1",
    name: "test",
    model: "claude",
    nodes: nodes.map((n) => ({
      id: n.id,
      name: n.id,
      skill: null,
      command: null,
      instruction: "test",
      inputs: n.inputs,
    })),
  };
}

describe("topologicalSort", () => {
  it("linear A→B→C → order [A, B, C]", () => {
    const chain = makeChain([
      { id: "A", inputs: [] },
      { id: "B", inputs: ["A"] },
      { id: "C", inputs: ["B"] },
    ]);
    const order = topologicalSort(chain);
    expect(order.map((n) => n.id)).toEqual(["A", "B", "C"]);
  });

  it("diamond A→B, A→C, B→D, C→D → D last, B and C before D", () => {
    const chain = makeChain([
      { id: "A", inputs: [] },
      { id: "B", inputs: ["A"] },
      { id: "C", inputs: ["A"] },
      { id: "D", inputs: ["B", "C"] },
    ]);
    const order = topologicalSort(chain);
    const ids = order.map((n) => n.id);
    expect(ids[0]).toBe("A");
    expect(ids[ids.length - 1]).toBe("D");
    expect(ids.indexOf("B")).toBeLessThan(ids.indexOf("D"));
    expect(ids.indexOf("C")).toBeLessThan(ids.indexOf("D"));
  });

  it("cycle A→B→A → error", () => {
    const chain = makeChain([
      { id: "A", inputs: ["B"] },
      { id: "B", inputs: ["A"] },
    ]);
    expect(() => topologicalSort(chain)).toThrow(/cycle/);
  });

  it("isolated node (no inputs, no dependents) → runs first", () => {
    const chain = makeChain([{ id: "solo", inputs: [] }]);
    const order = topologicalSort(chain);
    expect(order[0].id).toBe("solo");
  });
});
