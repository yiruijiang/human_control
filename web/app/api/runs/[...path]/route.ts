import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const RUNS_DIR = path.join(process.cwd(), "..", ".human-control", "runs");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const [runId, nodeId] = segments;
  const artifactPath = path.join(RUNS_DIR, runId, `${nodeId}.json`);
  if (!fs.existsSync(artifactPath)) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }
  try {
    const data = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid artifact JSON" }, { status: 500 });
  }
}
