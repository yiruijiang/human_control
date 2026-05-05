import { describe, it, expect } from "bun:test";
import { parseChain, parseConfig, validateChain } from "../validate.ts";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

let _tmpCounter = 0;
function tmpYaml(content: string): string {
  const f = path.join(os.tmpdir(), `hc-test-${Date.now()}-${++_tmpCounter}.yaml`);
  fs.writeFileSync(f, content);
  return f;
}

const validChainYaml = `
version: "1"
name: "Test Chain"
model: claude
nodes:
  - id: fetch
    name: Fetch
    skill: null
    command: null
    instruction: do fetch
    inputs: []
  - id: analyze
    name: Analyze
    skill: null
    command: null
    instruction: do analyze
    inputs: [fetch]
  - id: report
    name: Report
    skill: null
    command: null
    instruction: do report
    inputs: [analyze]
`;

const validConfigYaml = `
models:
  claude:
    type: claude_code_cli
`;

describe("parseChain + validateChain", () => {
  it("valid 3-node chain → no error", () => {
    const chainFile = tmpYaml(validChainYaml);
    const configFile = tmpYaml(validConfigYaml);
    const chain = parseChain(chainFile);
    const config = parseConfig(configFile);
    expect(() => validateChain(chain, config)).not.toThrow();
  });

  it("skill + command both set → validation error", () => {
    const file = tmpYaml(`
version: "1"
name: Test
model: claude
nodes:
  - id: a
    name: A
    skill: browse
    command: echo hi
    instruction: do it
    inputs: []
`);
    expect(() => parseChain(file)).toThrow(/mutually exclusive/);
  });

  it("top-level model missing from config → validation error", () => {
    const chainFile = tmpYaml(validChainYaml);
    const configFile = tmpYaml(`
models:
  deepseek:
    type: api
    base_url: https://api.deepseek.com/v1
    key_env: DEEPSEEK_API_KEY
    model: deepseek-chat
`);
    const chain = parseChain(chainFile);
    const config = parseConfig(configFile);
    expect(() => validateChain(chain, config)).toThrow(/claude/);
  });

  it("node model missing from config → error at validation", () => {
    const chainFile = tmpYaml(`
version: "1"
name: Test
model: claude
nodes:
  - id: a
    name: A
    skill: null
    command: null
    instruction: do it
    inputs: []
    model: deepseek
`);
    const configFile = tmpYaml(validConfigYaml);
    const chain = parseChain(chainFile);
    const config = parseConfig(configFile);
    expect(() => validateChain(chain, config)).toThrow(/deepseek/);
  });

  it("node.inputs references nonexistent node → error", () => {
    const chainFile = tmpYaml(`
version: "1"
name: Test
model: claude
nodes:
  - id: a
    name: A
    skill: null
    command: null
    instruction: do it
    inputs: [nonexistent]
`);
    const configFile = tmpYaml(validConfigYaml);
    const chain = parseChain(chainFile);
    const config = parseConfig(configFile);
    expect(() => validateChain(chain, config)).toThrow(/nonexistent/);
  });

  it("node.inputs contains own id → validation error", () => {
    const chainFile = tmpYaml(`
version: "1"
name: Test
model: claude
nodes:
  - id: a
    name: A
    skill: null
    command: null
    instruction: do it
    inputs: [a]
`);
    const configFile = tmpYaml(validConfigYaml);
    const chain = parseChain(chainFile);
    const config = parseConfig(configFile);
    expect(() => validateChain(chain, config)).toThrow(/itself/);
  });

  it("duplicate node IDs → validation error", () => {
    const chainFile = tmpYaml(`
version: "1"
name: Test
model: claude
nodes:
  - id: a
    name: A
    skill: null
    command: null
    instruction: do it
    inputs: []
  - id: a
    name: A2
    skill: null
    command: null
    instruction: do it again
    inputs: []
`);
    const configFile = tmpYaml(validConfigYaml);
    const chain = parseChain(chainFile);
    const config = parseConfig(configFile);
    expect(() => validateChain(chain, config)).toThrow(/duplicate/);
  });
});
