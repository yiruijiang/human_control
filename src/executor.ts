import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawnSync } from "child_process";
import type { Chain, ChainNode, Config, Artifact } from "./types.ts";
import { writeArtifact, loadArtifact } from "./artifacts.ts";
import { loadSkillContent, stripInteractiveSections } from "./skills.ts";

const BROWSE_BIN_PATH = path.join(os.homedir(), ".claude", "skills", "gstack", "browse", "dist");
const MAX_SPAWN_BUFFER = 50 * 1024 * 1024;  // 50MB
const DEFAULT_NODE_TIMEOUT_MS = 300_000;    // 5 min

interface ExecutorOptions {
  resume?: boolean;
  dryRun?: boolean;
  runDir: string;
  order: ChainNode[];
  chain: Chain;
  config: Config;
  assetsPath: string;
  fromNodeId?: string;
}

export async function execute(opts: ExecutorOptions): Promise<void> {
  const { resume, dryRun, runDir, order, chain, config, assetsPath } = opts;
  const gstackPath = path.join(assetsPath, "repos", "gstack");

  if (dryRun) {
    console.log("Execution order (dry run):");
    for (const node of order) {
      console.log(`  ${node.id}: ${node.name}`);
    }
    return;
  }

  // fromNodeId: skip nodes before the specified node in topo order
  let started = !opts.fromNodeId;
  for (const node of order) {
    if (!started) {
      if (node.id === opts.fromNodeId) started = true;
      else continue;
    }
    // STEP 1 — cache check
    if (node.cache) {
      const cached = loadArtifact(runDir, node.id);
      if (cached) {
        console.log(`[skip] ${node.name} (cache:true)`);
        continue;
      } else {
        console.warn(`[warn] ${node.name} has cache:true but no completed artifact — executing anyway`);
      }
    }

    // STEP 1b — auto-resume check
    if (resume) {
      const existing = loadArtifact(runDir, node.id);
      if (existing) {
        console.log(`[skip] ${node.name} (auto-resume)`);
        continue;
      }
    }

    // STEP 2 — collect inputs
    const contextParts: string[] = [];
    for (const parentId of node.inputs) {
      const artifact = loadArtifact(runDir, parentId);
      if (!artifact) {
        throw new Error(`dependency "${parentId}" not completed — cannot run "${node.id}"`);
      }
      contextParts.push(`### Output of "${artifact.node_name}" (node: ${parentId})\n${artifact.output}`);
    }

    // STEP 3 — load skill
    let skillContent = "";
    if (node.skill) {
      const raw = loadSkillContent(gstackPath, node.skill);
      skillContent = stripInteractiveSections(raw, node.skill);
    }

    // STEP 4 — build prompt temp file
    const promptFile = fs.mkdtempSync(path.join(os.tmpdir(), "hc-prompt-")) + ".txt";
    let promptContent = "";
    if (skillContent) promptContent += skillContent + "\n\n";
    promptContent += `## Task\n${node.instruction}`;
    if (contextParts.length > 0) {
      promptContent += `\n\n## Context from prior steps\n${contextParts.join("\n\n")}`;
    }
    fs.writeFileSync(promptFile, promptContent);

    const startMs = Date.now();
    let rawOutput = "";
    let rawStderr = "";
    let failed = false;
    let failReason = "";

    try {
      console.log(`[run] ${node.name} (${node.id})`);

      if (node.command) {
        // STEP 5a — command node
        const cmdFile = fs.mkdtempSync(path.join(os.tmpdir(), "hc-cmd-")) + ".sh";
        fs.writeFileSync(cmdFile, node.command, { mode: 0o755 });

        const env = {
          ...process.env,
          HC_RUN_DIR: runDir,
          HC_CONTEXT_FILE: promptFile,
          HC_NODE_ID: node.id,
          HC_CHAIN_NAME: chain.name,
        };

        const result = spawnSync("sh", [cmdFile], {
          env,
          cwd: process.cwd(),
          encoding: "utf8",
          maxBuffer: MAX_SPAWN_BUFFER,
          timeout: DEFAULT_NODE_TIMEOUT_MS,
        });
        fs.unlinkSync(cmdFile);

        rawOutput = result.stdout ?? "";
        rawStderr = result.stderr ?? "";

        if (result.status !== 0) {
          failed = true;
          failReason = rawStderr || `exited with code ${result.status}`;
        }
      } else {
        // STEP 5b — model node
        const effectiveModel = node.model ?? chain.model;
        const modelConfig = config.models[effectiveModel];

        if (modelConfig.type === "claude_code_cli") {
          const envPath = process.env.PATH
            ? `${BROWSE_BIN_PATH}:${process.env.PATH}`
            : BROWSE_BIN_PATH;
          const timeout = modelConfig.timeout_ms ?? DEFAULT_NODE_TIMEOUT_MS;

          const result = spawnSync(
            "claude",
            ["--print", "--permission-mode", "acceptEdits", "--allowedTools", "Bash,Read,Write,WebSearch"],
            {
              input: promptContent,
              env: { ...process.env, PATH: envPath },
              encoding: "utf8",
              maxBuffer: MAX_SPAWN_BUFFER,
              timeout,
            }
          );
          rawOutput = result.stdout ?? "";
          rawStderr = result.stderr ?? "";

          if (rawOutput.trim() === "") {
            failed = true;
            failReason = "empty output from claude (refusal or rate limit)";
          } else if (/error|rate.?limit|refused/i.test(rawStderr)) {
            failed = true;
            failReason = rawStderr;
          }
        } else if (modelConfig.type === "local") {
          const response = await fetch(`http://${modelConfig.base_url}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: modelConfig.model,
              messages: [{ role: "user", content: promptContent }],
              stream: false,
            }),
          });
          if (!response.ok) {
            failed = true;
            failReason = `local model HTTP ${response.status}: ${await response.text()}`;
          } else {
            const data = await response.json() as any;
            rawOutput = data?.message?.content ?? "";
            if (!rawOutput) {
              failed = true;
              failReason = "empty response from local model";
            }
          }
        } else if (modelConfig.type === "api") {
          const apiKey = process.env[modelConfig.key_env!];
          if (!apiKey) {
            failed = true;
            failReason = `API key env var "${modelConfig.key_env}" not set`;
          } else {
            const response = await fetch(`${modelConfig.base_url}/chat/completions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: modelConfig.model,
                messages: [{ role: "user", content: promptContent }],
              }),
            });
            if (!response.ok) {
              failed = true;
              failReason = `API HTTP ${response.status}: ${await response.text()}`;
            } else {
              const data = await response.json() as any;
              rawOutput = data?.choices?.[0]?.message?.content ?? "";
              if (!rawOutput) {
                failed = true;
                failReason = "empty response from API model";
              }
            }
          }
        }
      }
    } finally {
      fs.unlinkSync(promptFile);
    }

    const artifact: Artifact = {
      node_id: node.id,
      node_name: node.name,
      run_id: path.basename(runDir),
      model: node.command ? "shell" : (node.model ?? chain.model),
      status: failed ? "failed" : "completed",
      output: rawOutput,
      error: failed ? failReason : null,
      duration_ms: Date.now() - startMs,
    };

    writeArtifact(runDir, node.id, artifact);

    if (failed) {
      console.error(`[fail] ${node.name}: ${failReason}`);
      throw new Error(`node "${node.id}" failed — chain aborted`);
    }

    console.log(`[done] ${node.name} (${Date.now() - startMs}ms)`);
  }
}
