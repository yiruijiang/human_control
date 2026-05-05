import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const CHAINS_DIR = path.join(process.cwd(), "..", ".human-control", "chains");

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const safeId = path.basename(id, ".yaml") + ".yaml";
  const filePath = path.join(CHAINS_DIR, safeId);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Chain not found" }, { status: 404 });
  }
  return new NextResponse(fs.readFileSync(filePath, "utf8"), {
    headers: { "Content-Type": "text/plain" },
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const safeId = path.basename(id, ".yaml") + ".yaml";
  const yaml = await req.text();
  const filePath = path.join(CHAINS_DIR, safeId);
  fs.mkdirSync(CHAINS_DIR, { recursive: true });
  fs.writeFileSync(filePath, yaml);
  return NextResponse.json({ path: safeId });
}
