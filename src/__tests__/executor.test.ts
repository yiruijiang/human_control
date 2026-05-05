import { describe, it, expect, spyOn } from "bun:test";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as child_process from "child_process";
import { execute } from "../executor.ts";
import { writeArtifact, loadArtifact, loadArtifactRaw } from "../artifacts.ts";
import type { Chain, Config, Artifact } from "../types.ts";

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "hc-executor-test-"));
}

const baseChain: Chain = {
  version: "1",
  name: "Test Chain",
  model: "claude",
  nodes: [
    { id: "a", name: "A", skill: null, command: null, instruction: "do a", inputs: [] },
    { id: "b", name: "B", skill: null, command: null, instruction: "do b", inputs: ["a"] },
  ],
};

const baseConfig: Config = {
  models: { claude: { type: "claude_code_cli" } },
};

function completedArtifact(nodeId: string, nodeName: string): Artifact {
  return {
    node_id: nodeId,
    node_name: nodeName,
    run_id: "run1",
    model: "claude",
    status: "completed",
    output: "output",
    error: null,
    duration_ms: 10,
  };
}

function mockSpawn(stdout: string, stderr = "", status = 0) {
  return spyOn(child_process, "spawnSync").mockImplementation(() => ({
    stdout,
    stderr,
    status,
    pid: 1,
    signal: null,
    output: [],
  }));
}

describe("executor", () => {
  it("--resume: node with completed artifact → skipped", async () => {
    const runDir = tmpDir();
    writeArtifact(runDir, "a", completedArtifact("a", "A"));
    const spy = mockSpawn("output from b");

    await execute({
      resume: true,
      dryRun: false,
      runDir,
      order: baseChain.nodes,
      chain: baseChain,
      config: baseConfig,
      assetsPath: "/nonexistent",
    });

    // Only b was spawned (a was skipped)
    expect(spy.mock.calls.length).toBe(1);
    expect(loadArtifact(runDir, "b")?.status).toBe("completed");
    spy.mockRestore();
  });

  it("--resume: node with failed artifact → executes", async () => {
    const runDir = tmpDir();
    writeArtifact(runDir, "a", {
      ...completedArtifact("a", "A"),
      status: "failed",
      error: "previous fail",
      output: "",
    });
    const spy = mockSpawn("output");

    await execute({
      resume: true,
      dryRun: false,
      runDir,
      order: [baseChain.nodes[0]],
      chain: baseChain,
      config: baseConfig,
      assetsPath: "/nonexistent",
    });

    expect(spy.mock.calls.length).toBeGreaterThan(0);
    spy.mockRestore();
  });

  it("--resume: node with no artifact → executes", async () => {
    const runDir = tmpDir();
    const spy = mockSpawn("output");

    await execute({
      resume: true,
      dryRun: false,
      runDir,
      order: [baseChain.nodes[0]],
      chain: baseChain,
      config: baseConfig,
      assetsPath: "/nonexistent",
    });

    expect(spy.mock.calls.length).toBeGreaterThan(0);
    spy.mockRestore();
  });

  it("cache:true + completed artifact → skipped", async () => {
    const runDir = tmpDir();
    const cachedChain: Chain = {
      ...baseChain,
      nodes: [{ ...baseChain.nodes[0], cache: true }],
    };
    writeArtifact(runDir, "a", completedArtifact("a", "A"));
    const spy = mockSpawn("output");

    await execute({
      resume: false,
      dryRun: false,
      runDir,
      order: cachedChain.nodes,
      chain: cachedChain,
      config: baseConfig,
      assetsPath: "/nonexistent",
    });

    expect(spy.mock.calls.length).toBe(0);
    spy.mockRestore();
  });

  it("cache:true + no artifact → executes, logs warning", async () => {
    const runDir = tmpDir();
    const cachedChain: Chain = {
      ...baseChain,
      nodes: [{ ...baseChain.nodes[0], cache: true }],
    };
    const spy = mockSpawn("output");

    await execute({
      resume: false,
      dryRun: false,
      runDir,
      order: cachedChain.nodes,
      chain: cachedChain,
      config: baseConfig,
      assetsPath: "/nonexistent",
    });

    expect(spy.mock.calls.length).toBeGreaterThan(0);
    spy.mockRestore();
  });

  it("failed node (non-zero exit from command) → artifact failed, chain aborts", async () => {
    const runDir = tmpDir();
    const spy = mockSpawn("", "command not found", 1);
    const commandChain: Chain = {
      ...baseChain,
      nodes: [{ ...baseChain.nodes[0], command: "exit 1" }],
    };

    await expect(
      execute({
        resume: false,
        dryRun: false,
        runDir,
        order: commandChain.nodes,
        chain: commandChain,
        config: baseConfig,
        assetsPath: "/nonexistent",
      })
    ).rejects.toThrow();

    expect(loadArtifactRaw(runDir, "a")?.status).toBe("failed");
    spy.mockRestore();
  });

  it("failed claude node (empty stdout) → artifact failed, chain aborts", async () => {
    const runDir = tmpDir();
    const spy = mockSpawn("   ", "", 0);

    await expect(
      execute({
        resume: false,
        dryRun: false,
        runDir,
        order: [baseChain.nodes[0]],
        chain: baseChain,
        config: baseConfig,
        assetsPath: "/nonexistent",
      })
    ).rejects.toThrow();

    const artifact = loadArtifactRaw(runDir, "a");
    expect(artifact?.status).toBe("failed");
    expect(artifact?.error).toMatch(/empty output/);
    spy.mockRestore();
  });

  it("failed claude node (stderr contains rate limit) → artifact failed", async () => {
    const runDir = tmpDir();
    const spy = mockSpawn("some output", "rate limit exceeded", 0);

    await expect(
      execute({
        resume: false,
        dryRun: false,
        runDir,
        order: [baseChain.nodes[0]],
        chain: baseChain,
        config: baseConfig,
        assetsPath: "/nonexistent",
      })
    ).rejects.toThrow();

    expect(loadArtifactRaw(runDir, "a")?.status).toBe("failed");
    spy.mockRestore();
  });

  it("command node receives HC_RUN_DIR, HC_CONTEXT_FILE, HC_NODE_ID env vars", async () => {
    const runDir = tmpDir();
    let capturedEnv: Record<string, string> = {};

    const spy = spyOn(child_process, "spawnSync").mockImplementation(
      (cmd: any, args: any, opts: any) => {
        capturedEnv = opts?.env ?? {};
        return { stdout: "output", stderr: "", status: 0, pid: 1, signal: null, output: [] };
      }
    );

    const commandChain: Chain = {
      ...baseChain,
      nodes: [{ ...baseChain.nodes[0], command: "echo hi" }],
    };

    await execute({
      resume: false,
      dryRun: false,
      runDir,
      order: commandChain.nodes,
      chain: commandChain,
      config: baseConfig,
      assetsPath: "/nonexistent",
    });

    expect(capturedEnv.HC_RUN_DIR).toBe(runDir);
    expect(capturedEnv.HC_NODE_ID).toBe("a");
    expect(typeof capturedEnv.HC_CONTEXT_FILE).toBe("string");
    spy.mockRestore();
  });

  it("dependency not completed → abort with message naming the missing dependency", async () => {
    const runDir = tmpDir();
    // run b without pre-existing a artifact
    await expect(
      execute({
        resume: false,
        dryRun: false,
        runDir,
        order: [baseChain.nodes[1]],
        chain: baseChain,
        config: baseConfig,
        assetsPath: "/nonexistent",
      })
    ).rejects.toThrow(/dependency.*a/i);
  });
});
