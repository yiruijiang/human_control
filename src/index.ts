import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { parseChain, parseConfig, validateChain, runPreflightChecks } from "./validate.ts";
import { topologicalSort } from "./topo.ts";
import { generateRunDir, writeMeta, loadMeta } from "./artifacts.ts";
import { execute } from "./executor.ts";

const HC_DIR = ".human-control";
const RUNS_DIR = path.join(HC_DIR, "runs");

function getGitRoot(): string {
  try {
    return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
  } catch {
    return process.cwd();
  }
}

function findConfig(): string {
  const locations = [
    path.join(HC_DIR, "config.yaml"),
    path.join(process.cwd(), ".human-control", "config.yaml"),
  ];
  for (const loc of locations) {
    if (fs.existsSync(loc)) return loc;
  }
  throw new Error("config.yaml not found — create .human-control/config.yaml");
}

async function cmdRun(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error("Usage: human-control run <chain.yaml> [--resume <run_id>] [--dry-run]");
    process.exit(1);
  }

  const chainFile = args[0];
  let resumeId: string | undefined;
  let dryRun = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--resume" && args[i + 1]) {
      resumeId = args[++i];
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  const chain = parseChain(chainFile);
  const config = parseConfig(findConfig());
  validateChain(chain, config);

  const assetsPath = path.join(process.cwd(), "assets");
  await runPreflightChecks(chain, config, assetsPath);

  const order = topologicalSort(chain);

  if (dryRun) {
    console.log("Execution order (dry run):");
    for (const node of order) {
      console.log(`  ${node.id}: ${node.name}`);
    }
    return;
  }

  const gitRoot = getGitRoot();
  fs.mkdirSync(RUNS_DIR, { recursive: true });

  let runDir: string;
  if (resumeId) {
    runDir = path.join(RUNS_DIR, resumeId);
    if (!fs.existsSync(runDir)) {
      console.error(`run directory not found: ${runDir}`);
      process.exit(1);
    }
  } else {
    runDir = generateRunDir(RUNS_DIR);  // atomically creates directory
    writeMeta(runDir, {
      chain_file: path.relative(gitRoot, path.resolve(chainFile)),
      started_at: new Date().toISOString(),
    });
  }

  try {
    await execute({
      resume: !!resumeId,
      dryRun: false,
      runDir,
      order,
      chain,
      config,
      assetsPath,
    });
    console.log(`\nCompleted. Run ID: ${path.basename(runDir)}`);
  } catch (err: any) {
    console.error(`\nChain failed: ${err.message}`);
    process.exit(1);
  }
}

function cmdListRuns(args: string[]): void {
  const chainFilter = args[0];

  if (!fs.existsSync(RUNS_DIR)) {
    console.log("No runs yet.");
    return;
  }

  const runs = fs.readdirSync(RUNS_DIR).filter((d) =>
    fs.statSync(path.join(RUNS_DIR, d)).isDirectory()
  );

  const rows: Array<{ run_id: string; chain: string; status: string; nodes: string }> = [];

  for (const runId of runs) {
    const runDir = path.join(RUNS_DIR, runId);
    const meta = loadMeta(runDir);
    const chainName = meta?.chain_file ?? "unknown";

    if (chainFilter && !chainName.includes(path.basename(chainFilter, ".yaml"))) continue;

    const artifacts = fs
      .readdirSync(runDir)
      .filter((f) => f.endsWith(".json") && f !== "meta.json");

    const total = artifacts.length;
    const completed = artifacts.filter((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(runDir, f), "utf8")).status === "completed";
      } catch {
        return false;
      }
    }).length;

    const allDone = total > 0 && completed === total;
    const anyFailed = artifacts.some((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(runDir, f), "utf8")).status === "failed";
      } catch {
        return false;
      }
    });

    rows.push({
      run_id: runId,
      chain: path.basename(chainName, ".yaml"),
      status: anyFailed ? "failed" : allDone ? "completed" : "partial",
      nodes: `${completed}/${total}`,
    });
  }

  if (rows.length === 0) {
    console.log("No runs found.");
    return;
  }

  const idW = Math.max(6, ...rows.map((r) => r.run_id.length));
  const cW = Math.max(5, ...rows.map((r) => r.chain.length));
  const sW = 9;
  const nW = 5;

  console.log(
    `${"run_id".padEnd(idW)}  ${"chain".padEnd(cW)}  ${"status".padEnd(sW)}  ${"nodes".padEnd(nW)}`
  );
  for (const r of rows) {
    console.log(
      `${r.run_id.padEnd(idW)}  ${r.chain.padEnd(cW)}  ${r.status.padEnd(sW)}  ${r.nodes}`
    );
  }
}

const [, , command, ...rest] = process.argv;

switch (command) {
  case "run":
    await cmdRun(rest);
    break;
  case "list-runs":
    cmdListRuns(rest);
    break;
  default:
    console.log("Usage: human-control <run|list-runs> [args]");
    process.exit(1);
}
