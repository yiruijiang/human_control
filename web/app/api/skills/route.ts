import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const GSTACK_SKILLS = path.join(process.cwd(), "..", "assets", "repos", "gstack");

export async function GET() {
  try {
    if (!fs.existsSync(GSTACK_SKILLS)) {
      return NextResponse.json([]);
    }
    const entries = fs.readdirSync(GSTACK_SKILLS, { withFileTypes: true });
    const skills = entries
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(GSTACK_SKILLS, e.name, "SKILL.md")))
      .map((e) => {
        const skillFile = path.join(GSTACK_SKILLS, e.name, "SKILL.md");
        const content = fs.readFileSync(skillFile, "utf8");
        const firstLine = content.split("\n")[1]?.replace(/^#\s*/, "") ?? e.name;
        return { name: e.name, description: firstLine, path: e.name };
      });
    return NextResponse.json(skills);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
