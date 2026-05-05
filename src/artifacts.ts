import * as fs from "fs";
import * as path from "path";
import type { Artifact, RunMeta } from "./types.ts";

export function writeArtifact(runDir: string, nodeId: string, artifact: Artifact): void {
  const filePath = path.join(runDir, `${nodeId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(artifact, null, 2));
}

export function loadArtifact(runDir: string, nodeId: string): Artifact | null {
  const filePath = path.join(runDir, `${nodeId}.json`);
  if (!fs.existsSync(filePath)) return null;
  const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as Artifact;
  if (data.status !== "completed") return null;
  return data;
}

export function loadArtifactRaw(runDir: string, nodeId: string): Artifact | null {
  const filePath = path.join(runDir, `${nodeId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Artifact;
}

export function writeMeta(runDir: string, meta: RunMeta): void {
  fs.writeFileSync(path.join(runDir, "meta.json"), JSON.stringify(meta, null, 2));
}

export function loadMeta(runDir: string): RunMeta | null {
  const filePath = path.join(runDir, "meta.json");
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as RunMeta;
}

export function generateRunDir(baseDir: string): string {
  const ts = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
  const dir = path.join(baseDir, ts);

  try {
    fs.mkdirSync(dir);
    return dir;
  } catch (err: any) {
    if (err.code !== "EEXIST") throw err;
  }

  let i = 1;
  while (true) {
    const suffixDir = `${dir}-${i}`;
    try {
      fs.mkdirSync(suffixDir);
      return suffixDir;
    } catch (err: any) {
      if (err.code !== "EEXIST") throw err;
    }
    i++;
  }
}
