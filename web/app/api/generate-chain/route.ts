import { NextResponse } from "next/server";
import { parseChainYaml } from "@/lib/chain-utils";
import * as yaml from "js-yaml";

export async function POST(req: Request) {
  try {
    const { description } = await req.json();
    if (!description?.trim()) {
      return NextResponse.json({ error: "Description required" }, { status: 400 });
    }

    const prompt = `Generate a human-control YAML chain file. The schema and a working example are below.

EXAMPLE:
version: "1"
name: "Analyze GitHub repo"
model: claude
nodes:
  - id: fetch
    name: "Fetch repo info"
    skill: browse
    command: null
    instruction: "Browse this GitHub repo and summarize its purpose."
    inputs: []
  - id: analyze
    name: "Analyze"
    skill: null
    command: null
    instruction: "Given the repo summary above, assess its key features."
    inputs: [fetch]
  - id: report
    name: "Report"
    skill: null
    command: null
    instruction: "Write a one-paragraph summary."
    inputs: [analyze]

RULES:
- version: "1", name and model are required
- Every node must have: id, name, skill (string or null), command (string or null), instruction, and inputs (array of parent node IDs)
- skill and command are mutually exclusive (both null = pure LLM node)
- inputs defines dependencies: if B depends on A, B.inputs contains "A"
- First node should have inputs: []
- Output ONLY the YAML — no markdown fences, no "Here is your YAML:", no commentary at all
- First character of your output must be "v" (the start of "version:")

User request: ${description}

YAML:`;


    let lastYaml = "";
    let lastError = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      const { spawnSync } = await import("child_process");
      const retryHint = attempt > 0
        ? `\n\nYour previous output was invalid: ${lastError}\nOutput ONLY valid YAML starting with "version:".`
        : "";

      const result = spawnSync("claude", [
        "--print", "--permission-mode", "acceptEdits",
      ], {
        input: prompt + retryHint,
        encoding: "utf8", maxBuffer: 50 * 1024 * 1024, timeout: 90_000,
      });

      const raw = (result.stdout ?? "").trim();
      if (!raw) {
        lastError = "claude returned empty output";
        continue;
      }

      // Extract YAML: try multiple strategies
      let cleaned = raw;

      // Strategy 1: extract between ```yaml fences
      const fenceMatch = raw.match(/```ya?ml\s*\n([\s\S]*?)\n```/);
      if (fenceMatch) cleaned = fenceMatch[1].trim();

      // Strategy 2: extract from first "version:" to last non-empty line
      if (!fenceMatch) {
        const versionIdx = cleaned.indexOf("version:");
        if (versionIdx > 0) cleaned = cleaned.slice(versionIdx);
        // Strip trailing markdown/text after the YAML
        const lastNodeLine = cleaned.lastIndexOf("\n  ");
        if (lastNodeLine > 0) {
          const after = cleaned.slice(lastNodeLine + 1);
          if (!after.trim().startsWith(" ") && !after.trim().startsWith("-") && !after.trim().startsWith("version")) {
            // Find the last valid YAML-like line
            const lines = cleaned.split("\n");
            let endIdx = lines.length;
            for (let i = lines.length - 1; i >= 0; i--) {
              if (lines[i].trim() && !lines[i].startsWith(" ") && !lines[i].startsWith("-") && !lines[i].startsWith("version") && !lines[i].startsWith("name") && !lines[i].startsWith("model") && !lines[i].startsWith("nodes")) {
                endIdx = i;
              } else if (lines[i].trim()) {
                break;
              }
            }
            cleaned = lines.slice(0, endIdx + 1).join("\n").trim();
          }
        }
      }

      // Ensure YAML ends cleanly
      cleaned = cleaned.replace(/\n{3,}$/, "\n").trim();
      lastYaml = cleaned;

      try {
        const chain = parseChainYaml(cleaned);
        // Normalize: fill in defaults for optional fields
        chain.nodes = chain.nodes.map((n) => ({
          ...n,
          skill: n.skill ?? null,
          command: n.command ?? null,
          inputs: Array.isArray(n.inputs) ? n.inputs : [],
          instruction: n.instruction ?? "",
        }));
        // Re-dump to clean YAML
        const cleanYaml = yaml.dump(chain, { lineWidth: 120 });
        return NextResponse.json({ yaml: cleanYaml, attempts: attempt + 1 });
      } catch (e: any) {
        lastError = e.message;
      }
    }

    return NextResponse.json({
      error: "Failed to generate valid chain after 3 attempts",
      rawOutput: lastYaml,
      lastError,
    }, { status: 422 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
