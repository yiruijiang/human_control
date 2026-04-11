import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  const skillId = request.nextUrl.searchParams.get("id");
  if (!skillId || !/^[a-z0-9-]+$/.test(skillId)) {
    return NextResponse.json({ error: "Invalid skill id" }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), "source", "skills", skillId, "SKILL.md");
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }
}
