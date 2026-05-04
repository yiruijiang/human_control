import { describe, it, expect, spyOn } from "bun:test";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as child_process from "child_process";
import { execute } from "../executor.ts";
import { loadArtifact, writeArtifact, generateRunDir } from "../artifacts.ts";
import type { Chain, Config, Artifact } from "../types.ts";

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "hc-integration-"));
}

const threeNodeChain: Chain = {
  version: "1",
  name: "Integration Chain",
  model: "claude",
  nodes: [
    { id: "node1", name: "Node 1", skill: null, command: null, instruction: "step 1", inputs: [] },
    { id: "node2", name: "Node 2", skill: null, command: null, instruction: "step 2", inputs: ["node1"] },
    { id: "node3", name: "Node 3", skill: null, command: null, instruction: "step 3", inputs: ["node2"] },
  ],
};

const config: Config = {
  models: { claude: { type: "claude_code_cli" } },
};

describe("chain-run integration", () => {
  it("3-node linear chain: mock claude → 3 artifacts written", async () => {
    const runDir = tmpDir();
    let callCount = 0;

    spyOn(child_process, "spawnSync").mockImplementation(() => {
      callCount++;
      return {
        stdout: `canned output ${callCount}`,
        stderr: "",
        status: 0,
        pid: 1,
        signal: null,
        output: [],
      };
    });

    await execute({
      resume: false,
      dryRun: false,
      runDir,
      order: threeNodeChain.nodes,
      chain: threeNodeChain,
      config,
      assetsPath: "/nonexistent",
    });

    expect(callCount).toBe(3);

    for (const node of threeNodeChain.nodes) {
      const artifact = loadArtifact(runDir, node.id);
      expect(artifact).not.toBeNull();
      expect(artifact!.status).toBe("completed");
    }

    (child_process.spawnSync as any).mockRestore?.();
  });

  it("--resume after node2 failure: node1 artifact pre-exists → only node2+3 execute", async () => {
    const runDir = tmpDir();

    // Pre-populate node1 artifact
    writeArtifact(runDir, "node1", {
      node_id: "node1",
      node_name: "Node 1",
      run_id: path.basename(runDir),
      model: "claude",
      status: "completed",
      output: "node1 completed output",
      error: null,
      duration_ms: 10,
    });

    const executed: string[] = [];
    spyOn(child_process, "spawnSync").mockImplementation((cmd: any, args: any, opts: any) => {
      // Detect which node by checking HC_NODE_ID in parent env — use input content
      executed.push("claude");
      return { stdout: "fresh output", stderr: "", status: 0, pid: 1, signal: null, output: [] };
    });

    await execute({
      resume: true,
      dryRun: false,
      runDir,
      order: threeNodeChain.nodes,
      chain: threeNodeChain,
      config,
      assetsPath: "/nonexistent",
    });

    // node1 skipped, node2+3 executed
    expect(executed.length).toBe(2);
    expect(loadArtifact(runDir, "node1")!.output).toBe("node1 completed output");

    (child_process.spawnSync as any).mockRestore?.();
  });

  it("command node reads $HC_RUN_DIR and writes output captured as artifact", async () => {
    const runDir = tmpDir();

    const commandChain: Chain = {
      ...threeNodeChain,
      nodes: [
        { id: "cmd", name: "Cmd", skill: null, command: `echo "run_dir=$HC_RUN_DIR"`, instruction: "", inputs: [] },
      ],
    };

    // Use real spawnSync for this one
    await execute({
      resume: false,
      dryRun: false,
      runDir,
      order: commandChain.nodes,
      chain: commandChain,
      config,
      assetsPath: "/nonexistent",
    });

    const artifact = loadArtifact(runDir, "cmd");
    expect(artifact).not.toBeNull();
    expect(artifact!.output).toContain(runDir);
  });
});
