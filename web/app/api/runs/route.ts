import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const RUNS_DIR = path.join(process.cwd(), "..", ".human-control", "runs");

export async function GET() {
  try {
    if (!fs.existsSync(RUNS_DIR)) return NextResponse.json([]);
    const dirs = fs.readdirSync(RUNS_DIR).filter((d) =>
      fs.statSync(path.join(RUNS_DIR, d)).isDirectory()
    );
    const runs = dirs.map((runId) => {
      const metaFile = path.join(RUNS_DIR, runId, "meta.json");
      let meta: any = {};
      if (fs.existsSync(metaFile)) {
        meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
      }
      const artifacts = fs.readdirSync(path.join(RUNS_DIR, runId))
        .filter((f) => f.endsWith(".json") && f !== "meta.json");
      const completed = artifacts.filter((f) => {
        try {
          return JSON.parse(fs.readFileSync(path.join(RUNS_DIR, runId, f), "utf8")).status === "completed";
        } catch { return false; }
      }).length;
      return { runId, chainFile: meta.chain_file, total: artifacts.length, completed, startedAt: meta.started_at };
    });
    return NextResponse.json(runs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
