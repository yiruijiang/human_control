import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const CHAINS_DIR = path.join(process.cwd(), "..", ".human-control", "chains");

export async function GET() {
  try {
    if (!fs.existsSync(CHAINS_DIR)) {
      return NextResponse.json([]);
    }
    const files = fs.readdirSync(CHAINS_DIR).filter((f) => f.endsWith(".yaml"));
    const items = files.map((f) => ({
      name: path.basename(f, ".yaml"),
      path: f,
    }));
    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, yaml } = await req.json();
    if (!name || !yaml) {
      return NextResponse.json({ error: "name and yaml required" }, { status: 400 });
    }
    const safeName = path.basename(name, ".yaml") + ".yaml";
    const filePath = path.join(CHAINS_DIR, safeName);
    fs.mkdirSync(CHAINS_DIR, { recursive: true });
    fs.writeFileSync(filePath, yaml);
    return NextResponse.json({ path: safeName }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
