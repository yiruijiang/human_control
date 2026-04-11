import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get("id");
  if (!agentId || !/^[a-z0-9-]+$/.test(agentId)) {
    return NextResponse.json({ error: "Invalid agent id" }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), "source", "agents", `${agentId}.txt`);
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }
}
