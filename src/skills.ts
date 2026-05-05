import * as fs from "fs";

export function loadSkillContent(gstackPath: string, skillName: string): string {
  if (skillName.includes("..") || skillName.includes("/") || skillName.includes("\\")) {
    throw new Error(`invalid skill name: "${skillName}"`);
  }
  const skillFile = `${gstackPath}/${skillName}/SKILL.md`;
  return fs.readFileSync(skillFile, "utf8");
}

export function stripInteractiveSections(content: string, skillName = "unknown"): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let stripping = false;
  let strippingLevel = 0;
  let strippedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{2,3})\s+(.+)/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2];

      if (stripping && level <= strippingLevel) {
        // End of stripped section, this heading is same/higher level
        stripping = false;
      }

      if (!stripping && /AskUserQuestion/i.test(title)) {
        stripping = true;
        strippingLevel = level;
        strippedCount++;
        console.error(`[strip] "${title}" from skill "${skillName}"`);
        continue;
      }
    }

    if (!stripping) {
      result.push(line);
    }
  }

  if (strippedCount === 0) {
    console.error(`[warn] no AskUserQuestion sections found in "${skillName}"`);
  }

  return result.join("\n");
}
