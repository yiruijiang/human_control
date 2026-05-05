import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { parseChainYaml } from "@/lib/chain-utils";

export async function POST(req: Request) {
  try {
    const { description } = await req.json();
    if (!description?.trim()) {
      return NextResponse.json({ error: "Description required" }, { status: 400 });
    }

    const schemaPrompt = `Generate a valid human-control YAML chain file with this schema:
nodes:
  - id: string (unique)
    name: string
    skill: string | null (gstack skill name, or null)
    command: string | null (shell command, or null — mutually exclusive with skill)
    instruction: string (what the node should do)
    inputs: string[] (list of node IDs this node depends on — empty for first node)
    model: string (optional, overrides top-level model)

Rules:
- skill and command are mutually exclusive (both can be null for pure LLM node)
- inputs array defines graph edges: if B depends on A, B.inputs includes "A"
- version must be "1"
- top-level model is required (e.g., "claude")
- Output ONLY valid YAML — no markdown fences, no explanation, no commentary
- First line must be "version: \"1\""`;

    const userPrompt = `${schemaPrompt}\n\nUser request: ${description}\n\nYAML output:`;

    let attempts = 0;
    let lastYaml = "";
    let lastError = "";

    while (attempts < 3) {
      const { spawnSync } = await import("child_process");
      const retryHint = attempts > 0 ? `\n\nPrevious attempt failed validation: ${lastError}\nFix the errors and output ONLY valid YAML.` : "";

      const result = spawnSync("claude", ["--print", "--permission-mode", "acceptEdits"], {
        input: userPrompt + retryHint,
        encoding: "utf8", maxBuffer: 50 * 1024 * 1024, timeout: 60_000,
      });

      const raw = (result.stdout ?? "").trim();
      const cleaned = raw.replace(/^```ya?ml\s*\n?/im, "").replace(/\n?```\s*$/im, "");
      lastYaml = cleaned;

      try {
        parseChainYaml(cleaned);
        return NextResponse.json({ yaml: cleaned, attempts: attempts + 1 });
      } catch (e: any) {
        lastError = e.message;
        attempts++;
      }
    }

    return NextResponse.json({
      error: `Failed to generate valid chain after 3 attempts`,
      rawOutput: lastYaml,
      lastError,
    }, { status: 422 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
