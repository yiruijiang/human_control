import { NextResponse } from "next/server";
import { parseChainYaml } from "@/lib/chain-utils";
import * as yaml from "js-yaml";

export async function POST(req: Request) {
  try {
    const { currentYaml, instruction } = await req.json();
    if (!currentYaml?.trim()) return NextResponse.json({ error: "currentYaml required" }, { status: 400 });
    if (!instruction?.trim()) return NextResponse.json({ error: "instruction required" }, { status: 400 });

    const prompt = `You are refining an existing human-control YAML chain file based on a user's request.

CURRENT CHAIN:
\`\`\`yaml
${currentYaml}
\`\`\`

REFINEMENT REQUEST: ${instruction}

INSTRUCTIONS:
- Modify the YAML above to satisfy the refinement request
- Keep the same version, name, and model unless the request explicitly changes them
- Add, remove, or modify nodes as needed
- Ensure all node IDs are unique and inputs arrays are correct
- Output ONLY the complete updated YAML — no markdown fences, no explanation
- First character must be "v" (start of "version:")`;

    let lastYaml = "";
    let lastError = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      const { spawnSync } = await import("child_process");
      const retryHint = attempt > 0
        ? `\n\nPrevious attempt was invalid: ${lastError}\nOutput ONLY the complete valid YAML.`
        : "";

      const result = spawnSync("claude", ["--print", "--permission-mode", "acceptEdits"], {
        input: prompt + retryHint,
        encoding: "utf8", maxBuffer: 50 * 1024 * 1024, timeout: 90_000,
      });

      const raw = (result.stdout ?? "").trim();
      if (!raw) { lastError = "claude returned empty output"; continue; }

      let cleaned = raw;
      const fenceMatch = raw.match(/```ya?ml\s*\n([\s\S]*?)\n```/);
      if (fenceMatch) cleaned = fenceMatch[1].trim();
      else {
        const vi = cleaned.indexOf("version:");
        if (vi > 0) cleaned = cleaned.slice(vi);
      }

      try {
        parseChainYaml(cleaned);
        // Re-dump for consistent formatting
        const chain = yaml.load(cleaned) as any;
        const cleanYaml = yaml.dump(chain, { lineWidth: 120 });
        return NextResponse.json({ yaml: cleanYaml, attempts: attempt + 1 });
      } catch (e: any) {
        lastError = e.message;
        lastYaml = cleaned;
      }
    }

    return NextResponse.json({
      error: "Failed to refine chain after 3 attempts",
      rawOutput: lastYaml,
      lastError,
    }, { status: 422 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
