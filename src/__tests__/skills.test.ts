import { describe, it, expect } from "bun:test";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { stripInteractiveSections, loadSkillContent } from "../skills.ts";

const sampleWithAsk = `
## Introduction
This skill does stuff.

## AskUserQuestion
What do you want to do?

## Next Steps
Do the thing.
`;

const sampleWithLowercase = `
## Introduction
Intro.

## askuserquestion
Lower case heading.

## After
After content.
`;

const sampleMultiple = `
## Intro
Intro.

## AskUserQuestion First
First ask.

## Middle
Middle content.

## AskUserQuestion Second
Second ask.

## End
End content.
`;

const sampleNoAsk = `
## Section A
Content A.

## Section B
Content B.
`;

const sampleAskAtEnd = `
## Intro
Content.

## AskUserQuestion
This is the last section, no following heading.
`;

describe("stripInteractiveSections", () => {
  it("strips AskUserQuestion section", () => {
    const result = stripInteractiveSections(sampleWithAsk);
    expect(result).toContain("Introduction");
    expect(result).toContain("Next Steps");
    expect(result).not.toContain("What do you want");
    expect(result).not.toContain("## AskUserQuestion");
  });

  it("case-insensitive match", () => {
    const result = stripInteractiveSections(sampleWithLowercase);
    expect(result).toContain("Introduction");
    expect(result).toContain("After");
    expect(result).not.toContain("Lower case heading");
  });

  it("strips multiple AskUserQuestion sections", () => {
    const result = stripInteractiveSections(sampleMultiple);
    expect(result).toContain("Middle content");
    expect(result).toContain("End content");
    expect(result).not.toContain("First ask");
    expect(result).not.toContain("Second ask");
  });

  it("no matching sections → content unchanged", () => {
    const result = stripInteractiveSections(sampleNoAsk, "testskill");
    expect(result).toContain("Section A");
    expect(result).toContain("Section B");
    expect(result).toBe(sampleNoAsk);
  });

  it("last section (no following heading) → stripped to EOF", () => {
    const result = stripInteractiveSections(sampleAskAtEnd);
    expect(result).toContain("Intro");
    expect(result).not.toContain("This is the last section");
  });
});

describe("loadSkillContent", () => {
  it("reads SKILL.md content from gstack path", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hc-skills-test-"));
    const skillDir = path.join(dir, "browse");
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), "# Browse Skill\nContent here");
    const result = loadSkillContent(dir, "browse");
    expect(result).toContain("Browse Skill");
  });

  it("throws when SKILL.md does not exist", () => {
    expect(() => loadSkillContent("/nonexistent-dir", "missing")).toThrow();
  });

  it("throws on path traversal in skill name", () => {
    expect(() => loadSkillContent("/tmp", "../../../etc/passwd")).toThrow(/invalid skill name/);
  });
});
