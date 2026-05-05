import { describe, it, expect } from "bun:test";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { writeArtifact, loadArtifact, loadArtifactRaw, writeMeta, loadMeta, generateRunDir } from "../artifacts.ts";
import type { Artifact } from "../types.ts";

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "hc-artifacts-test-"));
}

describe("artifacts", () => {
  it("writeArtifact writes valid JSON to {runDir}/{nodeId}.json", () => {
    const dir = tmpDir();
    const artifact: Artifact = {
      node_id: "fetch",
      node_name: "Fetch",
      run_id: "2026-01-01T00-00-00",
      model: "claude",
      status: "completed",
      output: "hello world",
      error: null,
      duration_ms: 100,
    };
    writeArtifact(dir, "fetch", artifact);
    const filePath = path.join(dir, "fetch.json");
    expect(fs.existsSync(filePath)).toBe(true);
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    expect(parsed.output).toBe("hello world");
    expect(parsed.status).toBe("completed");
  });

  it("loadArtifact returns artifact when file exists and status=completed", () => {
    const dir = tmpDir();
    const artifact: Artifact = {
      node_id: "a",
      node_name: "A",
      run_id: "run1",
      model: "claude",
      status: "completed",
      output: "output",
      error: null,
      duration_ms: 50,
    };
    writeArtifact(dir, "a", artifact);
    const loaded = loadArtifact(dir, "a");
    expect(loaded).not.toBeNull();
    expect(loaded!.output).toBe("output");
  });

  it("loadArtifact returns null when file does not exist", () => {
    const dir = tmpDir();
    expect(loadArtifact(dir, "missing")).toBeNull();
  });

  it("loadArtifact returns null when status=failed", () => {
    const dir = tmpDir();
    const artifact: Artifact = {
      node_id: "b",
      node_name: "B",
      run_id: "run1",
      model: "claude",
      status: "failed",
      output: "",
      error: "it broke",
      duration_ms: 10,
    };
    writeArtifact(dir, "b", artifact);
    expect(loadArtifact(dir, "b")).toBeNull();
  });

  it("loadMeta returns chain_file from meta.json", () => {
    const dir = tmpDir();
    writeMeta(dir, { chain_file: "chains/test.yaml", started_at: "2026-01-01T00:00:00Z" });
    const meta = loadMeta(dir);
    expect(meta?.chain_file).toBe("chains/test.yaml");
  });

  it("run_id collision: second call in same second gets unique name", () => {
    const base = tmpDir();
    const first = generateRunDir(base);  // creates directory
    expect(fs.existsSync(first)).toBe(true);

    // Same-second call: first dir already exists, so gets -1 suffix
    const second = generateRunDir(base);
    expect(second).not.toBe(first);
    expect(second.endsWith("-1")).toBe(true);
  });

  it("generateRunDir normal case: no collision", () => {
    const base = tmpDir();
    const dir = generateRunDir(base);
    expect(fs.existsSync(dir)).toBe(true);
    expect(dir.startsWith(base)).toBe(true);
  });

  it("loadMeta returns null when file does not exist", () => {
    const dir = tmpDir();
    expect(loadMeta(dir)).toBeNull();
  });

  it("loadArtifactRaw returns artifact regardless of status", () => {
    const dir = tmpDir();
    const artifact: Artifact = {
      node_id: "x",
      node_name: "X",
      run_id: "run1",
      model: "claude",
      status: "failed",
      output: "",
      error: "boom",
      duration_ms: 1,
    };
    writeArtifact(dir, "x", artifact);
    const loaded = loadArtifactRaw(dir, "x");
    expect(loaded).not.toBeNull();
    expect(loaded!.status).toBe("failed");
  });

  it("loadArtifactRaw returns null when file does not exist", () => {
    const dir = tmpDir();
    expect(loadArtifactRaw(dir, "missing")).toBeNull();
  });
});
