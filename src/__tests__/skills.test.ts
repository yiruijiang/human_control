import { describe, it, expect } from "bun:test";
import { stripInteractiveSections } from "../skills.ts";

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
