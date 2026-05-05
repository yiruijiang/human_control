import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { parseChainYaml, topologicalSort } from "@/lib/chain-utils";

const RUNS_DIR = path.join(process.cwd(), "..", ".human-control", "runs");
const CONFIG_FILE = path.join(process.cwd(), "..", ".human-control", "config.yaml");
const GSTACK_ASSETS = path.join(process.cwd(), "..", "assets", "repos", "gstack");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chain, fromNode, resume: resumeRunId } = body;
    if (!chain) return NextResponse.json({ error: "chain required" }, { status: 400 });

    const parsed = typeof chain === "string" ? parseChainYaml(chain) : chain;
    let nodes = topologicalSort(parsed);

    if (fromNode) {
      const idx = nodes.findIndex((n) => n.id === fromNode);
      if (idx === -1) {
        return NextResponse.json({ error: `Node "${fromNode}" not found in chain` }, { status: 400 });
      }
      nodes = nodes.slice(idx);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const ts = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
          let runDir = resumeRunId ? path.join(RUNS_DIR, resumeRunId) : path.join(RUNS_DIR, ts);

          if (!resumeRunId) {
            try { fs.mkdirSync(runDir); } catch (e: any) {
              if (e.code === "EEXIST") {
                let i = 1;
                while (true) {
                  const d = `${runDir}-${i}`;
                  try { fs.mkdirSync(d); runDir = d; break; } catch { i++; }
                }
              } else throw e;
            }
            fs.writeFileSync(path.join(runDir, "meta.json"), JSON.stringify({
              chain_file: "generated", started_at: new Date().toISOString(),
            }));
          }

          const runId = path.basename(runDir);
          send("chain-start", { runId, totalNodes: nodes.length });

          const { spawnSync } = await import("child_process");
          const BROWSE_BIN = path.join(os.homedir(), ".claude", "skills", "gstack", "browse", "dist");

          for (const node of nodes) {
            send("node-status", { nodeId: node.id, status: "running" });
            const startMs = Date.now();
            let output = "";
            let error: string | null = null;
            let status: "completed" | "failed" = "completed";

            try {
              const promptParts: string[] = [];
              if (node.skill) {
                const sf = path.join(GSTACK_ASSETS, node.skill, "SKILL.md");
                if (fs.existsSync(sf)) promptParts.push(fs.readFileSync(sf, "utf8"));
              }
              promptParts.push(`## Task\n${node.instruction}`);
              for (const pId of node.inputs) {
                const af = path.join(runDir, `${pId}.json`);
                if (fs.existsSync(af)) {
                  const a = JSON.parse(fs.readFileSync(af, "utf8"));
                  promptParts.push(`### Output of "${a.node_name}" (node: ${pId})\n${a.output}`);
                }
              }
              const promptContent = promptParts.join("\n\n");

              if (node.command) {
                const tmpd = fs.mkdtempSync(path.join(os.tmpdir(), "hc-cmd-"));
                const cmdFile = path.join(tmpd, "cmd.sh");
                try {
                  fs.writeFileSync(cmdFile, node.command, { mode: 0o755 });
                  const result = spawnSync("sh", [cmdFile], {
                    env: { ...process.env, HC_RUN_DIR: runDir, HC_NODE_ID: node.id, HC_CHAIN_NAME: parsed.name },
                    encoding: "utf8", maxBuffer: 50 * 1024 * 1024, timeout: 300_000,
                  });
                  output = result.stdout ?? "";
                  if (result.status !== 0) { status = "failed"; error = result.stderr || `exit ${result.status}`; }
                } finally {
                  // Clean up temp dir
                  try { fs.rmSync(tmpd, { recursive: true }); } catch {}
                }
              } else {
                const envPath = process.env.PATH ? `${BROWSE_BIN}:${process.env.PATH}` : BROWSE_BIN;
                const result = spawnSync("claude", [
                  "--print", "--permission-mode", "acceptEdits", "--allowedTools", "Bash,Read,Write,WebSearch",
                ], { input: promptContent, env: { ...process.env, PATH: envPath }, encoding: "utf8", maxBuffer: 50*1024*1024, timeout: 300_000 });
                output = result.stdout ?? "";
                if (output.trim() === "") { status = "failed"; error = "empty output from claude (refusal or rate limit)"; }
                else if (/error|rate.?limit|refused/i.test(result.stderr ?? "")) { status = "failed"; error = result.stderr ?? ""; }
              }

              for (const line of output.split("\n")) {
                send("node-output", { nodeId: node.id, line: line + "\n" });
              }
            } catch (e: any) { status = "failed"; error = e.message; }

            const durationMs = Date.now() - startMs;
            fs.writeFileSync(path.join(runDir, `${node.id}.json`), JSON.stringify({
              node_id: node.id, node_name: node.name, run_id: runId,
              model: node.command ? "shell" : (node.model ?? parsed.model),
              status, output, error, duration_ms: durationMs,
            }));

            if (status === "failed") {
              send("node-status", { nodeId: node.id, status: "failed", error, durationMs });
              send("chain-done", { status: "failed", failedNode: node.id });
              controller.close(); return;
            }
            send("node-status", { nodeId: node.id, status: "completed", durationMs });
          }
          send("chain-done", { status: "completed", totalDurationMs: 0 });
        } catch (e: any) { send("error", { error: e.message }); }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
